export function getTimestamp(line) {
  const createdAt = line?.__rerum?.createdAt ?? line?.createdAt ?? line?.modified ?? line?.created ?? line?.timestamp
  const isOverwritten = line?.__rerum?.isOverwritten ?? line?.isOverwritten

  const timestamps = [createdAt, isOverwritten]
    .filter(Boolean)
    .map(ts => {
      if (typeof ts === 'string') {
        const date = new Date(ts)
        return Number.isNaN(date.getTime()) ? null : date.getTime()
      }

      if (typeof ts === 'number') return ts
      return null
    })
    .filter(t => t !== null)

  return timestamps.length > 0 ? Math.max(...timestamps) : 0
}

export function getLineText(line) {
  if (line?.body) {
    if (typeof line.body === 'object' && line.body.value) {
      return line.body.value
    }

    if (Array.isArray(line.body)) {
      for (const bodyItem of line.body) {
        if (bodyItem?.value) {
          return bodyItem.value
        }
      }
    }

    if (typeof line.body === 'string') {
      return line.body
    }
  }

  return line?.text ?? line?.content ?? line?.['cnt:chars'] ?? line?.value ?? ''
}

export function getLineBounding(line) {
  const target = line?.target ?? line?.on

  if (target?.selector?.value) {
    const { selector } = target
    if (selector.value) {
      const match = selector.value.match(/xywh=(?:pixel:)?(\d+),(\d+),(\d+),(\d+)/)
      if (match) {
        const [, x, y, width, height] = match
        return {
          x: parseInt(x),
          y: parseInt(y),
          width: parseInt(width),
          height: parseInt(height)
        }
      }
    }
  }

  if (
    line?.x !== undefined &&
    line?.y !== undefined &&
    (line?.width !== undefined || line?.w !== undefined) &&
    (line?.height !== undefined || line?.h !== undefined)
  ) {
    return {
      x: line.x,
      y: line.y,
      width: line.width ?? line.w,
      height: line.height ?? line.h
    }
  }

  return null
}

export function getLineImageSource(line) {
  const target = line?.target ?? line?.on
  if (target?.source) return target.source
  if (typeof target === 'string') return target

  return line?.image ?? line?.src ?? line?.source ?? null
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown date'
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return ''

  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'just now'
}

export function boundingChanged(box1, box2) {
  if (!box1 && !box2) return false
  if (!box1 || !box2) return true

  return (
    box1.x !== box2.x ||
    box1.y !== box2.y ||
    box1.width !== box2.width ||
    box1.height !== box2.height
  )
}
