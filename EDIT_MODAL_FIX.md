# Edit Modal Implementation Plan

## Current Structure
The Edit Modal currently uses a 3-step flow which is complex. We need to replace it with a simpler Basic/Advanced toggle.

## New Structure

### Basic Edit Mode
- Title
- Slug (with edit button)
- Category
- Featured Image
- Content (main editor)
- Status dropdown
- Featured checkbox

### Advanced Edit Mode
All Basic fields PLUS:
- Excerpt
- Tags
- SEO Title
- SEO Description
- SEO Keywords
- Publish Date

## Implementation
Replace the entire Edit Modal section (lines 1381-1700) with the new Basic/Advanced toggle structure.
