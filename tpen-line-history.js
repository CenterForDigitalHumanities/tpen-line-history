/**
 * TPEN Line History Component
 * A custom element that builds on concepts from the rerum-history-component
 * to show the history of lines of transcription from TPEN projects.
 * 
 * @module tpen-line-history
 * @author Research Computing Group
 * @license MIT
 */

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
    }

    connectedCallback() {
        this.render()
        this.setupEventListeners()
    }

    /**
     * Setup event listeners for TPEN.eventdispatcher
     */
    setupEventListeners() {
        // Listen for active line changes from TPEN.eventdispatcher
        const dispatcher = window.TPEN?.eventdispatcher
        if (!dispatcher) {
            console.warn('TPEN.eventdispatcher not found. Line history will not update automatically.')
        } else {
            dispatcher.addEventListener('line-selected', (event) => {
                this.handleLineChange(event.detail)
            })
            dispatcher.addEventListener('line-updated', (event) => {
                this.handleLineUpdate(event.detail)
            })
        }

        // Also listen for custom events dispatched directly to this element
        this.addEventListener('update-line', (event) => {
            this.handleLineChange(event.detail)
        })
    }

    /**
     * Handle line change events
     * @param {Object} lineData - The line data from the event
     */
    async handleLineChange(lineData) {
        if (!lineData) return
        
        this.currentLine = lineData
        
        // Fetch history for this line
        await this.fetchLineHistory(lineData)
        this.render()
    }

    /**
     * Handle line update events
     * @param {Object} lineData - The updated line data
     */
    handleLineUpdate(lineData) {
        if (!lineData) return
        
        // Add the update to history and re-render
        this.handleLineChange(lineData)
    }

    /**
     * Fetch the history for a given line
     * @param {Object} lineData - The line data object
     */
    async fetchLineHistory(lineData) {
        const uri = lineData.uri ?? lineData['@id']
        
        // No URI, just show current state
        if (!uri) {
            this.historyData = [lineData]
            return
        }

        // If the line has a URI, fetch its history
        try {
            const response = await fetch(`${uri}/history`)
            if (response.ok) {
                const history = await response.json()
                this.historyData = Array.isArray(history) ? history : [history]
                return
            }
            // If history endpoint doesn't exist, use the current line as history
            this.historyData = [lineData]
        } catch (error) {
            console.warn('Could not fetch line history:', error)
            this.historyData = [lineData]
        }
    }

    /**
     * Extract text from a line object
     * @param {Object} line - The line object
     * @returns {String} The text content
     */
    getLineText(line) {
        // Support various text property names
        return line.text ?? line.content ?? line['cnt:chars'] ?? line.body ?? line.value ?? ''
    }

    /**
     * Extract image bounding information from a line object
     * @param {Object} line - The line object
     * @returns {Object|null} The bounding box information
     */
    getLineBounding(line) {
        // Support various bounding property structures
        const target = line.target ?? line.on
        if (target?.selector?.value) {
            // Handle IIIF selector format
            // xywh format: xywh=x,y,w,h
            const match = target.selector.value.match(/xywh=(\d+),(\d+),(\d+),(\d+)/)
            if (match) {
                return {
                    x: parseInt(match[1]),
                    y: parseInt(match[2]),
                    width: parseInt(match[3]),
                    height: parseInt(match[4])
                }
            }
        }

        // Direct bounding box properties
        if (line.x !== undefined && line.y !== undefined && 
            (line.width !== undefined || line.w !== undefined) &&
            (line.height !== undefined || line.h !== undefined)) {
            return {
                x: line.x,
                y: line.y,
                width: line.width ?? line.w,
                height: line.height ?? line.h
            }
        }

        return null
    }

    /**
     * Format a timestamp for display
     * @param {String|Number} timestamp - The timestamp to format
     * @returns {String} Formatted date string
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'Unknown date'
        const date = new Date(timestamp)
        return date.toLocaleString()
    }

    /**
     * Compare two bounding boxes
     * @param {Object} box1 - First bounding box
     * @param {Object} box2 - Second bounding box
     * @returns {Boolean} True if boxes are different
     */
    boundingChanged(box1, box2) {
        if (!box1 && !box2) return false
        if (!box1 || !box2) return true
        return box1.x !== box2.x || box1.y !== box2.y || 
               box1.width !== box2.width || box1.height !== box2.height
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

            .timestamp {
                font-size: 0.8rem;
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
            const historyItems = this.historyData.map((item, index) => {
                const text = this.getLineText(item)
                const bounding = this.getLineBounding(item)
                const timestamp = item.modified ?? item.created ?? item['__created'] ?? item.timestamp
                const isLatest = index === 0
                
                // Check if bounding changed from previous version
                const prevBounding = index < this.historyData.length - 1 
                    ? this.getLineBounding(this.historyData[index + 1]) 
                    : null
                const boundingChanged = this.boundingChanged(bounding, prevBounding)

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

                return `
                    <li class="history-item">
                        <div class="history-item-header">
                            <span class="version-label">${isLatest ? 'Current Version' : `Version ${this.historyData.length - index}`}</span>
                            <span class="timestamp">${this.formatTimestamp(timestamp)}</span>
                        </div>
                        <div class="history-text ${text ? '' : 'empty'}">
                            ${text ?? '(empty)'}
                        </div>
                        ${boundingHtml}
                    </li>
                `
            }).join('')

            content = `
                <div class="history-header">
                    <h2>Line History</h2>
                </div>
                <ul class="history-list">
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

    /**
     * Manually update with line data (for testing or direct use)
     * @param {Object} lineData - The line data to display
     */
    updateLine(lineData) {
        this.handleLineChange(lineData)
    }
}

// Register the custom element
customElements.define('tpen-line-history', TPENLineHistory)

export default TPENLineHistory
