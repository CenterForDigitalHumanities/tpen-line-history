# tpen-line-history

A custom web component that displays the history of transcription lines from TPEN (Text and Process Encoding Network) projects. This component integrates with the [rerum-history-component](https://cubap.github.io/rerum-history-component/) to provide robust history fetching and display for tracking changes to transcription lines, including text modifications and image bounding adjustments.

## Features

- **RERUM History Integration**: Uses `RerumHistoryData` for robust history fetching from RERUM endpoints
- **Line History Display**: Shows all historical versions of a transcription line in a vertical list
- **Text Change Tracking**: Displays the evolution of transcription text over time
- **Image Bounding Visualization**: Shows changes to the image coordinates and dimensions for each line version
- **TPEN Integration**: Listens to TPEN.eventdispatcher for active line changes
- **Split Screen Ready**: Designed to work in a split-screen layout as a tall rectangular panel
- **Version Relationship Tracking**: Builds proper parent-child relationships between versions using RERUM heuristics
- **Multiple Endpoint Support**: Automatically fetches from both `/history/` and `/since/` endpoints
- **Responsive Design**: Adapts to different screen sizes

## Installation

### Using as a Module

```html
<script type="module">
  import './tpen-line-history.js';
</script>
```

### Using as a Script

```html
<script type="module" src="https://path-to-your-host/tpen-line-history.js"></script>
```

## Usage

### Basic HTML

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./tpen-line-history.js"></script>
</head>
<body>
  <tpen-line-history id="historyComponent"></tpen-line-history>
</body>
</html>
```

### With TPEN Event Dispatcher

The component automatically listens for events from `TPEN.eventdispatcher`:

```javascript
// The component listens for these events:
// - 'tpen-set-line': When a user selects a line

// Example: Trigger line selection
window.TPEN.eventdispatcher.dispatchEvent(
  new CustomEvent('tpen-set-line', {
    detail: {
      '@id': 'https://devstore.rerum.io/v1/id/...',
      text: 'Transcription text',
      x: 100,
      y: 150,
      width: 800,
      height: 50
    }
  })
);
```

### With RERUM Annotation Data

The component works seamlessly with RERUM annotation pages. Here's how to load annotation data:

```javascript
async function loadAnnotationPage(annotationPageUri) {
  const response = await fetch(annotationPageUri);
  const annotationPage = await response.json();
  
  // Convert annotations to line format
  const lines = annotationPage.items.map((annotation, index) => {
    // Extract coordinates from selector value (xywh=pixel:x,y,w,h)
    let coordinates = { x: 0, y: 0, width: 100, height: 50 };
    if (annotation.target?.selector?.value) {
      const match = annotation.target.selector.value.match(/xywh=pixel:(\\d+),(\\d+),(\\d+),(\\d+)/);
      if (match) {
        coordinates = {
          x: parseInt(match[1]),
          y: parseInt(match[2]),
          width: parseInt(match[3]),
          height: parseInt(match[4])
        };
      }
    }
    
    return {
      '@id': annotation.id,
      uri: annotation.id,
      text: `Line ${index + 1}`, // Or extract from annotation.body
      ...coordinates
    };
  });
  
  return lines;
}

// Example usage with the demo annotation page
const lines = await loadAnnotationPage('https://devstore.rerum.io/v1/id/68d4490c73ed8d0e76715dc3');
```

### Manual Updates

You can also update the component manually:

```javascript
const historyComponent = document.querySelector('tpen-line-history');
historyComponent.updateLine({
  '@id': 'line-uri',
  text: 'Transcription text',
  x: 100,
  y: 150,
  width: 800,
  height: 50
});
```

## Line Data Format

The component accepts line data in various formats. Here are the supported properties:

### Text Content

The component looks for text in these properties (in order of priority):
- `text`
- `content`
- `cnt:chars`
- `body`
- `value`

### Image Bounding

The component supports multiple bounding formats:

**Direct properties:**
```javascript
{
  x: 100,
  y: 150,
  width: 800,
  height: 50
}
```

**IIIF Selector format:**
```javascript
{
  target: {
    selector: {
      value: 'xywh=100,150,800,50'
    }
  }
}
```

### History Data

If a line has a URI (`uri` or `@id`), the component will attempt to fetch history from `{uri}/history`. The history should be an array of line objects in chronological order (newest first).

## Styling

The component uses Shadow DOM for style encapsulation. You can customize the appearance by modifying the styles in the component's render method, or by using CSS custom properties (if implemented).

The component is designed to:
- Fill its container height
- Display as a vertical scrollable list
- Work well in a narrow panel (recommended width: 300-500px)

## Demo

Open `demo.html` in a web browser to see the component in action. The demo includes:
- Sample lines with history
- Interactive line selection
- Split-screen layout demonstration

## Browser Support

This component uses modern web standards:
- Custom Elements (Web Components)
- Shadow DOM
- ES6 Modules
- Async/Await

Supported browsers:
- Chrome/Edge 79+
- Firefox 63+
- Safari 12.1+

## Development

### Project Structure

```
tpen-line-history/
├── tpen-line-history.js   # Main component file
├── demo.html              # Demo/example page
├── README.md              # This file
└── LICENSE                # MIT License
```

### Testing the Component

1. Open `demo.html` in a web browser
2. Click on different lines to see their history
3. Observe how text changes and bounding changes are displayed

## API Reference

### Custom Element: `<tpen-line-history>`

#### Methods

##### `updateLine(lineData)`
Manually update the component with new line data.

**Parameters:**
- `lineData` (Object): The line data object containing text and/or bounding information

**Example:**
```javascript
historyComponent.updateLine({
  '@id': 'http://example.com/line/123',
  text: 'Sample transcription',
  x: 100,
  y: 150,
  width: 800,
  height: 50
});
```

#### Events Listened

The component listens for these events on `window.TPEN.eventdispatcher`:

- **`line-selected`**: Triggered when a line is selected
  - `event.detail`: Line data object
  
- **`line-updated`**: Triggered when a line is modified
  - `event.detail`: Updated line data object

#### Custom Events

The component can also receive events dispatched directly to it:

- **`update-line`**: Manually trigger a line update
  - `event.detail`: Line data object

## License

MIT License - See [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Acknowledgments

- Built on top of [rerum-history-component](https://cubap.github.io/rerum-history-component/)
- Developed by the Research Computing Group at the Center for Digital Humanities
- Part of the TPEN (Text and Process Encoding Network) project
