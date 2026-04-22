export const sampleLine = {
  '@id': 'https://devstore.rerum.io/v1/id/sample-line-1',
  uri: 'https://devstore.rerum.io/v1/id/sample-line-1',
  text: 'Sample TPEN line text',
  x: 100,
  y: 250,
  width: 800,
  height: 50,
  target: {
    source: 'https://example.org/iiif/canvas/1',
    selector: {
      value: 'xywh=100,250,800,50'
    }
  },
  __rerum: {
    createdAt: '2025-01-01T00:00:00.000Z',
    isOverwritten: '2025-01-02T00:00:00.000Z'
  }
}

export const sampleAnnotationPage = {
  id: 'https://devstore.rerum.io/v1/id/sample-page',
  type: 'AnnotationPage',
  items: [
    {
      id: sampleLine['@id'],
      type: 'Annotation',
      target: sampleLine.target,
      body: {
        type: 'TextualBody',
        value: sampleLine.text
      }
    }
  ],
  _createdAt: '2025-01-01T00:00:00.000Z',
  _modifiedAt: '2025-01-02T00:00:00.000Z'
}

export const eventNameContract = {
  incoming: 'tpen-active-line-updated'
}

export function isLineLikePayload(value) {
  if (!value || typeof value !== 'object') return false

  const id = value.uri ?? value['@id'] ?? value.id
  if (!id || typeof id !== 'string') return false

  const hasTextLikeField =
    typeof value.text === 'string' ||
    typeof value.content === 'string' ||
    typeof value.value === 'string' ||
    typeof value.body === 'string' ||
    (value.body && typeof value.body.value === 'string')

  const hasBounding =
    Number.isFinite(value.x) &&
    Number.isFinite(value.y) &&
    Number.isFinite(value.width ?? value.w) &&
    Number.isFinite(value.height ?? value.h)

  return hasTextLikeField || hasBounding
}
