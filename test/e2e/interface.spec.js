import { test, expect } from '@playwright/test'

const mockLine = {
  id: 'https://devstore.rerum.io/v1/id/mock-line-1',
  type: 'Annotation',
  target: {
    source: 'https://example.org/iiif/canvas/1',
    selector: {
      value: 'xywh=100,250,800,50'
    }
  },
  body: {
    type: 'TextualBody',
    value: 'Mock line from fixture'
  }
}

const mockAnnotationPage = {
  id: 'https://devstore.rerum.io/v1/id/mock-page',
  type: 'AnnotationPage',
  items: [mockLine],
  _createdAt: '2025-01-01T00:00:00.000Z',
  _modifiedAt: '2025-01-02T00:00:00.000Z'
}

test.beforeEach(async ({ page }) => {
  await page.route('https://devstore.rerum.io/v1/id/68d4490c73ed8d0e76715dc3', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAnnotationPage)
    })
  })

  await page.route('https://app.t-pen.org/api/TPEN.js', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        class Dispatcher extends EventTarget {
          on(name, cb) { this.addEventListener(name, cb) }
        }
        const TPEN = { eventDispatcher: new Dispatcher(), activeProject: { manifest: 'https://example.org/iiif/manifest/1' }, activeLine: null }
        window.TPEN = TPEN
        export default TPEN
      `
    })
  })

  await page.route('https://app.t-pen.org/components/line-image/index.js', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        class TpenLineImage extends HTMLElement {}
        if (!customElements.get('tpen-line-image')) {
          customElements.define('tpen-line-image', TpenLineImage)
        }
        export default TpenLineImage
      `
    })
  })

  await page.route('https://cubap.github.io/rerum-history-component/src/rerum-history-tree.js', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        export class RerumHistoryData {
          constructor(uri) {
            this.uri = uri
            this.items = [{ '@id': uri, body: { value: 'History item text' }, __rerum: { createdAt: '2025-01-03T00:00:00.000Z' } }]
          }
          async fetch() {}
          getItems() { return this.items }
          getGraph() { return { nodes: 1 } }
          abort() {}
        }
      `
    })
  })
})

test('renders history after selecting a line in demo', async ({ page }) => {
  await page.goto('/demo.html')

  const lineItem = page.locator('.line-item').first()
  await expect(lineItem).toBeVisible()
  await lineItem.click()

  const history = page.locator('tpen-line-history')
  await expect(history).toBeVisible()

  const shadowText = await history.evaluate(el => el.shadowRoot?.textContent ?? '')
  expect(shadowText).toContain('Line History')
  expect(shadowText).toContain('History item text')
})
