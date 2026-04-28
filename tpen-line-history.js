/**
 * TPEN Line History Component
 * A custom element that builds on concepts from the rerum-history-component
 * to show the history of lines of transcription from TPEN projects.
 * 
 * @module tpen-line-history
 * @author Research Computing Group
 * @license MIT
 */

// Attempt to use an existing global TPEN if present (other scripts may load it via relative URLs)
let TPEN = (typeof window !== 'undefined' && window.TPEN) ? window.TPEN : null
let _tpImportPromise = null
if (!TPEN) {
    // Kick off a dynamic import but don't block module evaluation. We'll wait for it when needed.
    _tpImportPromise = (async () => {
        try {
            const mod = await import('https://app.t-pen.org/api/TPEN.js')
            TPEN = mod.default ?? mod.TPEN ?? (typeof window !== 'undefined' ? window.TPEN : null)
        } catch (e) {
            console.warn('tpen-line-history: dynamic import of TPEN failed:', e)
            TPEN = (typeof window !== 'undefined') ? window.TPEN ?? null : null
        }
        return TPEN
    })()
}

// Only import the TPEN line-image component if its custom element isn't already registered
if (typeof customElements !== 'undefined' && !customElements.get('tpen-line-image')) {
    // Fire-and-forget dynamic import; component registers itself when loaded.
    import('https://app.t-pen.org/components/line-image/index.js').catch(e => {
        console.warn('tpen-line-history: failed to import tpen-line-image component:', e)
    })
}

import { RerumHistoryData } from 'https://cubap.github.io/rerum-history-component/src/rerum-history-tree.js'
import {
    getTimestamp,
    getLineText,
    getLineBounding,
    getLineImageSource,
    formatTimestamp,
    formatTimeAgo,
    boundingChanged
} from './line-history-utils.js'

/**
 * Custom element for displaying TPEN line history
 * @class TPENLineHistory
 * @extends HTMLElement
 */
class TPENLineHistory extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.currentLine = null
        this.historyData = []
        this.rerumHistoryData = null
        this.historyGraph = null
    }

    // Keep utility method names on the class without redundant pass-through wrappers.
    getTimestamp = getTimestamp
    getLineText = getLineText
    getLineBounding = getLineBounding
    getLineImageSource = getLineImageSource
    formatTimestamp = formatTimestamp
    formatTimeAgo = formatTimeAgo
    boundingChanged = boundingChanged

    connectedCallback() {
        this.render()
        this.setupEventListeners()
        .then(() => this.handleLineChange(TPEN.activeLine))
    }

    disconnectedCallback() {
        // Clean up RerumHistoryData instance to prevent memory leaks
        if (this.rerumHistoryData) {
            this.rerumHistoryData.abort()
            this.rerumHistoryData = null
        }
    }

    /**
     * Setup event listeners for TPEN.eventDispatcher
     */
    async setupEventListeners() {
        // Ensure TPEN is loaded before setting up event listeners
        await this.ensureTPEN()
        
        if (TPEN?.eventDispatcher) {
            // Listen for active line changes from TPEN.eventDispatcher
            TPEN.eventDispatcher.on('tpen-active-line-updated', (event) => {
                this.handleLineChange(event.detail)
            })
        }
    }

    /**
     * Ensure TPEN is loaded and available
     */
    async ensureTPEN() {
        if (TPEN) return TPEN
        
        if (_tpImportPromise) {
            await _tpImportPromise
        }
        
        return TPEN
    }

    /**
     * Handle line change events
     * @param {Object} lineData - The line data from the event
     */
    async handleLineChange(lineData) {
        if (!lineData) return

        // Ensure TPEN is available for any operations that might need it
        await this.ensureTPEN()

        this.currentLine = lineData

        // Fetch history for this line
        await this.fetchLineHistory(lineData)
        this.render()
    }

    // tpen-transcription-line-save-success event when a line is updated

    /**
     * Fetch the history for a given line using RerumHistoryData
     * @param {Object} lineData - The line data object
     */
    async fetchLineHistory(lineData) {
        // If the line has a URI, fetch its history using RerumHistoryData
        if (lineData.uri || lineData['@id']) {
            const uri = lineData.uri || lineData['@id']
            try {
                // Clean up previous history data instance
                if (this.rerumHistoryData) {
                    this.rerumHistoryData.abort()
                }
                
                this.rerumHistoryData = new RerumHistoryData(uri)
                await this.rerumHistoryData.fetch()
                
                this.historyData = this.rerumHistoryData.getItems()
                this.historyGraph = this.rerumHistoryData.getGraph()
                
                // Sort by timestamp (most recent first) if we don't have graph structure
                if (this.historyData.length > 0) {
                    this.historyData.sort((a, b) => {
                        const timestampA = this.getTimestamp(a)
                        const timestampB = this.getTimestamp(b)
                        return timestampB - timestampA
                    })
                }
            } catch (error) {
                console.warn('Could not fetch line history with RerumHistoryData:', error)
                // Fallback to simple array with current line
                this.historyData = [lineData]
                this.historyGraph = null
            }
        } else {
            // No URI, just show current state
            this.historyData = [lineData]
            this.historyGraph = null
        }
    }

    /**
     * Extract IIIF manifest and canvas information from TPEN project and current line
     * @returns {Object} Object with manifest and canvas URLs
     */
    getIIIFContext() {
        // Get manifest from TPEN.activeProject (only if TPEN is loaded)
        let manifest = null
        if (TPEN?.activeProject?.manifest) {
            const {manifest: projectManifest} = TPEN.activeProject
            // Handle both string URL and array of URLs
            if (typeof projectManifest === 'string') {
                manifest = projectManifest
            } else if (Array.isArray(projectManifest) && projectManifest[0]) {
                manifest = projectManifest[0]
            }
        } else {
            const manifestElement = this.closest('[iiif-manifest]')
            if (manifestElement) {
                manifest = manifestElement.getAttribute('iiif-manifest')
            }
        }

        // Get canvas from current line target (annotation page canvas)
        let canvas = null
        if (this.currentLine) {
            const target = this.currentLine.target ?? this.currentLine.on
            if (target?.source) {
                canvas = target.source
            }
        }

        return { manifest, canvas }
    }

    /**
     * Render the component
     */
    render() {
        const styles = `
            :host {
                display: block;
                height: 100%;
                overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background: #f5f5f5;
            }

            .history-container {
                padding: 1rem;
                height: 100%;
            }

            .history-header {
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid #333;
            }

            .history-header h2 {
                margin: 0;
                font-size: 1.25rem;
                color: #333;
            }

            .no-line {
                text-align: center;
                color: #666;
                padding: 2rem;
                font-style: italic;
            }

            .history-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            .history-item {
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-bottom: 1rem;
                padding: 1rem;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .history-item:first-child {
                border-left: 4px solid #4CAF50;
            }

            .history-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
                font-size: 0.875rem;
                color: #666;
            }

            .version-label {
                font-weight: bold;
                color: #333;
            }

            .version-id {
                font-family: monospace;
                font-size: 0.75rem;
                color: #666;
                background: #f0f0f0;
                padding: 0.125rem 0.25rem;
                border-radius: 3px;
                margin-left: 0.5rem;
            }

            .timestamp {
                font-size: 0.8rem;
                cursor: help;
            }

            .history-text {
                padding: 0.75rem;
                background: #fafafa;
                border-left: 3px solid #2196F3;
                border-radius: 2px;
                font-family: monospace;
                white-space: pre-wrap;
                word-wrap: break-word;
                margin: 0.5rem 0;
            }

            .history-text.empty {
                color: #999;
                font-style: italic;
            }

            .bounding-info {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: #fff3cd;
                border-left: 3px solid #ffc107;
                border-radius: 2px;
                font-size: 0.875rem;
            }

            .bounding-info-title {
                font-weight: bold;
                margin-bottom: 0.25rem;
                color: #856404;
            }

            .bounding-values {
                font-family: monospace;
                color: #333;
            }

            .line-image-container {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: #f8f9fa;
                border-left: 3px solid #6c757d;
                border-radius: 2px;
            }

            .line-image-title {
                font-weight: bold;
                margin-bottom: 0.5rem;
                color: #495057;
                font-size: 0.875rem;
            }

            .line-image {
                max-width: 100%;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                display: block;
            }

            .no-image {
                color: #6c757d;
                font-style: italic;
                font-size: 0.875rem;
            }

            .changed-indicator {
                display: inline-block;
                margin-left: 0.5rem;
                padding: 0.125rem 0.375rem;
                background: #ff9800;
                color: white;
                border-radius: 3px;
                font-size: 0.75rem;
                font-weight: bold;
            }
        `

        let content = ''
        if (!this.currentLine || this.historyData.length === 0) {
            content = `<div class="no-line">Select a line to view its history</div>`
        } else {
            // Get IIIF context for the container
            const iiifContext = this.getIIIFContext()

            const historyItems = this.historyData.map((item, index) => {
                const text = this.getLineText(item)
                const bounding = this.getLineBounding(item)
                const timestamp = this.getTimestamp(item)
                const isLatest = index === 0

                // Check if bounding changed from previous version
                const prevBounding = index < this.historyData.length - 1
                    ? this.getLineBounding(this.historyData[index + 1])
                    : null
                const boundingChanged = this.boundingChanged(bounding, prevBounding)

                // Get version ID for better identification
                const versionId = item['@id'] ?? item.id ?? item._id ?? `version-${index}`
                const shortId = versionId.includes('/') ? versionId.split('/').pop() : versionId
                const lineId = item['@id'] ?? item.id ?? item._id

                let boundingHtml = ''
                if (bounding) {
                    boundingHtml = `
                        <div class="bounding-info">
                            <div class="bounding-info-title">
                                Image Bounding
                                ${boundingChanged && !isLatest ? '<span class="changed-indicator">CHANGED</span>' : ''}
                            </div>
                            <div class="bounding-values">
                                x: ${bounding.x}, y: ${bounding.y}, width: ${bounding.width}, height: ${bounding.height}
                            </div>
                        </div>
                    `
                }

                // Generate line image HTML
                let imageHtml = ''
                if (lineId && (iiifContext.manifest || iiifContext.canvas)) {
                    // Create region attribute from bounding coordinates
                    let regionAttr = ''
                    if (bounding) {
                        regionAttr = `region="${bounding.x},${bounding.y},${bounding.width},${bounding.height}"`
                    }
                    
                    imageHtml = `
                        <div class="line-image-container">
                            <div class="line-image-title">Line Image Preview</div>
                            <tpen-line-image 
                                tpen-line-id="${lineId}"
                                ${regionAttr}
                                class="line-image">
                            </tpen-line-image>
                        </div>
                    `
                } else if (lineId) {
                    imageHtml = `
                        <div class="line-image-container">
                            <div class="line-image-title">Line Image Preview</div>
                            <div class="no-image">Missing IIIF context (manifest/canvas)</div>
                        </div>
                    `
                } else if (bounding) {
                    imageHtml = `
                        <div class="line-image-container">
                            <div class="line-image-title">Line Image Preview</div>
                            <div class="no-image">Missing line ID for TPEN image component</div>
                        </div>
                    `
                }

                return `
                    <li class="history-item">
                        <div class="history-item-header">
                            <span class="version-label">${isLatest ? 'Current Version' : `Version ${this.historyData.length - index}`}</span>
                            <span class="version-id" title="${versionId}">(${shortId})</span>
                            <span class="timestamp" title="${this.formatTimeAgo(timestamp)}">${this.formatTimestamp(timestamp)}</span>
                        </div>
                        <div class="history-text ${text ? '' : 'empty'}">${text ?? '(empty)'}</div>
                        ${boundingHtml}
                        ${imageHtml}
                    </li>
                `
            }).join('')

            content = `
                <div class="history-header">
                    <h2>Line History</h2>
                </div>
                <ul class="history-list" 
                    ${iiifContext.manifest ? `iiif-manifest="${iiifContext.manifest}"` : ''}
                    ${iiifContext.canvas ? `iiif-canvas="${iiifContext.canvas}"` : ''}>
                    ${historyItems}
                </ul>
            `
        }

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="history-container">
                ${content}
            </div>
        `
    }
}

// Register the custom element
customElements.define('tpen-line-history', TPENLineHistory)

export default TPENLineHistory
