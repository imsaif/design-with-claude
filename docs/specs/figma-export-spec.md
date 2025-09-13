# Figma Export Specification

## Overview
This document specifies the technical requirements and implementation details for exporting design system data to Figma format.

## Figma API Integration

### Authentication
- **Method**: Personal Access Token
- **Header**: `X-Figma-Token: {token}`
- **Storage**: Environment variables, config files, or CLI prompts
- **Validation**: Token format validation and API connectivity test

### Rate Limiting
- **Limit**: 1000 requests per minute
- **Implementation**: Request queue with exponential backoff
- **Monitoring**: Track requests per window and remaining quota
- **Recovery**: Automatic retry with increasing delays

### API Endpoints
```
POST /v1/files                    # Create new file
PUT  /v1/files/{key}              # Update existing file
POST /v1/images                   # Upload images
GET  /v1/files/{key}/nodes        # Get file nodes
```

## Data Conversion Specifications

### Design Tokens to Figma Variables

#### Color Tokens
```javascript
// Input: Design system color token
{
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "500": "#3b82f6",
      "900": "#1e3a8a"
    }
  }
}

// Output: Figma variable
{
  "name": "color/primary/500",
  "type": "COLOR",
  "value": { "r": 0.231, "g": 0.510, "b": 0.965 },
  "scopes": ["ALL_SCOPES"],
  "description": "Primary color - 500 variant"
}
```

#### Typography Tokens
```javascript
// Input: Typography token
{
  "typography": {
    "fontSize": {
      "lg": { "size": "1.125rem", "lineHeight": "1.75rem" }
    },
    "fontFamily": {
      "body": "Inter, sans-serif"
    }
  }
}

// Output: Figma text style
{
  "name": "text/lg",
  "styleType": "TEXT",
  "textStyle": {
    "fontFamily": "Inter",
    "fontSize": 18,
    "lineHeight": { "unit": "PIXELS", "value": 28 },
    "fontWeight": 400
  }
}
```

#### Spacing Tokens
```javascript
// Input: Spacing token
{
  "spacing": {
    "md": "1rem",
    "lg": "1.5rem"
  }
}

// Output: Figma variable
{
  "name": "spacing/md",
  "type": "FLOAT",
  "value": 16,
  "scopes": ["GAP", "WIDTH_HEIGHT", "CORNER_RADIUS"]
}
```

### Component Conversion

#### Component Structure Mapping
```javascript
// Input: Component definition
{
  "name": "Button",
  "variants": {
    "primary": { backgroundColor: "#3b82f6" },
    "secondary": { backgroundColor: "transparent" }
  },
  "states": {
    "default": {},
    "hover": { opacity: 0.9 },
    "disabled": { opacity: 0.5 }
  },
  "props": ["variant", "size", "disabled"]
}

// Output: Figma component set
{
  "name": "Button",
  "type": "COMPONENT_SET",
  "children": [
    {
      "name": "variant=primary, state=default",
      "type": "COMPONENT",
      "componentPropertyDefinitions": {
        "variant": {
          "type": "VARIANT",
          "defaultValue": "primary",
          "variantOptions": ["primary", "secondary"]
        }
      }
    }
  ]
}
```

#### Auto-Layout Conversion
```javascript
// Input: Layout properties
{
  "layout": {
    "direction": "horizontal",
    "alignItems": "center",
    "justifyContent": "center",
    "gap": "8px",
    "padding": "12px 24px"
  }
}

// Output: Figma auto-layout
{
  "layoutMode": "HORIZONTAL",
  "primaryAxisAlignItems": "CENTER",
  "counterAxisAlignItems": "CENTER",
  "itemSpacing": 8,
  "paddingLeft": 24,
  "paddingRight": 24,
  "paddingTop": 12,
  "paddingBottom": 12
}
```

### Layout Conversion

#### Page Structure
```javascript
// Input: Layout definition
{
  "name": "Landing Page",
  "sections": [
    {
      "type": "hero",
      "component": "Hero",
      "props": { "title": "Welcome" }
    },
    {
      "type": "features",
      "component": "FeatureGrid",
      "props": { "columns": 3 }
    }
  ]
}

// Output: Figma page
{
  "name": "Landing Page",
  "type": "CANVAS",
  "children": [
    {
      "name": "Desktop - 1440px",
      "type": "FRAME",
      "width": 1440,
      "layoutMode": "VERTICAL",
      "children": [
        { /* Hero section frame */ },
        { /* Features section frame */ }
      ]
    }
  ]
}
```

## File Structure Organization

### Page Hierarchy
1. **🎨 Design System** - Tokens, components, and style guide
2. **📱 Components** - Individual component variants and documentation
3. **📄 Layouts** - Generated page layouts (Desktop, Tablet, Mobile)
4. **🎯 Examples** - Usage examples and component combinations

### Naming Conventions
- **Variables**: `category/subcategory/variant` (e.g., `color/primary/500`)
- **Components**: `ComponentName` (e.g., `Button`, `Input Field`)
- **Variants**: `property=value, property=value` (e.g., `variant=primary, size=md`)
- **Styles**: `category/name` (e.g., `color/primary`, `text/heading-lg`)
- **Frames**: `Device - Width` (e.g., `Desktop - 1440px`, `Mobile - 375px`)

## Error Handling

### API Errors
- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **429 Too Many Requests**: Rate limit exceeded
- **500 Server Error**: Figma service issues

### Recovery Strategies
- **Token Issues**: Prompt for new token, validate before proceeding
- **Rate Limits**: Implement exponential backoff with maximum retry attempts
- **Network Issues**: Retry with circuit breaker pattern
- **Validation Errors**: Provide clear error messages with correction suggestions

### Validation Requirements

#### Pre-Export Validation
- [ ] Figma token is valid and has required permissions
- [ ] Design data structure is complete and valid
- [ ] Color values are within valid ranges (0-1 for RGB)
- [ ] Typography values are positive numbers
- [ ] Component structure is properly nested

#### Post-Export Validation
- [ ] Figma file was created successfully
- [ ] All components are properly structured
- [ ] Variables are correctly applied
- [ ] Styles are properly organized
- [ ] Auto-layout is functioning correctly

## Performance Considerations

### Optimization Strategies
- **Batch Operations**: Group related API calls to minimize requests
- **Parallel Processing**: Upload independent components simultaneously
- **Incremental Updates**: Only update changed components in existing files
- **Asset Optimization**: Compress images before upload
- **Request Deduplication**: Cache identical API responses

### Memory Management
- **Streaming**: Process large files in chunks
- **Cleanup**: Release memory after each major operation
- **Limits**: Set maximum file size and component count limits

### Expected Performance
- **Small Projects** (< 10 components): < 30 seconds
- **Medium Projects** (10-50 components): 1-3 minutes
- **Large Projects** (50+ components): 3-10 minutes

## Security Considerations

### Token Security
- **Storage**: Never log tokens in plaintext
- **Transmission**: Always use HTTPS for API requests
- **Environment**: Store in secure environment variables
- **Rotation**: Support token rotation without service interruption

### Data Privacy
- **Content**: No design content is stored locally after export
- **Metadata**: Only necessary metadata is retained for debugging
- **Logging**: Sanitize logs to remove sensitive information

## Testing Requirements

### Unit Tests
- [ ] Token validation and authentication
- [ ] Color conversion accuracy (hex, RGB, HSL)
- [ ] Typography conversion (px, rem, em)
- [ ] Component structure generation
- [ ] Auto-layout property mapping

### Integration Tests
- [ ] End-to-end export workflow
- [ ] API error handling
- [ ] Rate limit compliance
- [ ] Large file handling
- [ ] Network failure recovery

### Manual Tests
- [ ] Generated Figma files display correctly
- [ ] Component variants function properly
- [ ] Auto-layout behaves as expected
- [ ] Variables are correctly applied
- [ ] Styles are properly inherited

## API Response Examples

### Successful File Creation
```json
{
  "name": "Generated Design System",
  "key": "abc123def456",
  "url": "https://www.figma.com/file/abc123def456/Generated-Design-System",
  "thumbnailUrl": "https://s3-alpha.figma.com/thumbnails/abc123.png",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid node structure: missing required property 'type'",
  "details": {
    "nodeId": "button-primary-default",
    "property": "type"
  }
}
```

This specification provides the technical foundation for implementing robust Figma export functionality that produces high-quality, properly structured design files.