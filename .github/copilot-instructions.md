# Copilot Instructions for tpen-line-history

## Code Style Guidelines

### Semicolons
- **Do not use terminal semicolons**
- If a statement requires a semicolon to avoid ambiguity (e.g., starting with `[`, `(`, or `/`), place it at the beginning of the line
- Example:
  ```javascript
  const arr = [1, 2, 3]
  ;[1, 2, 3].forEach(x => console.log(x))
  ```

### Modern JavaScript Patterns
- **Prefer optional chaining (`?.`)** over nested conditionals
  ```javascript
  // Good
  const text = line?.text ?? ''
  
  // Avoid
  const text = line && line.text ? line.text : ''
  ```

- **Prefer nullish coalescing (`??`)** over `||` for default values
  ```javascript
  // Good - only uses default for null/undefined
  const value = input ?? 'default'
  
  // Avoid - uses default for any falsy value
  const value = input || 'default'
  ```

- **Use ternaries for simple conditionals**
  ```javascript
  // Good
  const label = isLatest ? 'Current Version' : `Version ${index}`
  
  // Avoid
  let label
  if (isLatest) {
    label = 'Current Version'
  } else {
    label = `Version ${index}`
  }
  ```

- **Use switch statements** for multiple conditions when clearer than if-else chains

### Control Flow
- **Prefer guard clauses and early returns** to avoid else blocks
  ```javascript
  // Good
  function process(data) {
    if (!data) return null
    if (!data.valid) return null
    
    return processValid(data)
  }
  
  // Avoid
  function process(data) {
    if (data) {
      if (data.valid) {
        return processValid(data)
      } else {
        return null
      }
    } else {
      return null
    }
  }
  ```

- **Avoid unnecessary else blocks** after returns
  ```javascript
  // Good
  if (condition) {
    return value
  }
  return otherValue
  
  // Avoid
  if (condition) {
    return value
  } else {
    return otherValue
  }
  ```

### Modules
- **Always use ES6 modules** (import/export) instead of CommonJS (require/module.exports)
- Use `export default` for main exports
- Use named exports for utilities

### Dependencies
- **Prefer plain JavaScript** with reduced dependencies
- Only add dependencies when they provide significant value
- Evaluate maintenance burden before adding new libraries

### Language
- **Use inclusive language** in all code, comments, and documentation
- Avoid terms like whitelist/blacklist, master/slave, etc.
- Use alternatives like allowlist/blocklist, primary/replica, etc.

## Project Structure
- Main component: `tpen-line-history.js`
- Demo page: `demo.html`
- ES6 modules are the standard (configured in package.json with `"type": "module"`)

## Testing
- Test changes with `demo.html`
- Ensure component works with TPEN event dispatcher integration
- Validate history display for various line data formats
