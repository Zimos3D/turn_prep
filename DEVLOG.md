# Daily Development Checklist

## Before Starting Work

- [ ] Read the TODO comment in the file you're about to implement
- [ ] Check ARCHITECTURE.md if you need to understand the big picture
- [ ] Look at TODO.md for implementation order recommendations

## While Implementing

- [ ] Keep TypeScript strict mode happy (all types defined)
- [ ] Use existing utility functions (don't duplicate logic)
- [ ] Follow the patterns established in similar files
- [ ] Update localization (en.json) as you add new UI strings
- [ ] Add comments for complex logic

## Key Principles

✓ **Types First**: Define types before using them  
✓ **Utilities**: Create general-purpose helpers  
✓ **Separation of Concerns**: Data layer ≠ UI layer  
✓ **Localization**: All UI strings in en.json  
✓ **Error Handling**: Use logging utilities, not console.log  
✓ **Documentation**: Each TODO file explains what it does  

## Development Commands

```bash
# Install dependencies (first time only)
npm install

# Start development with hot reload
npm run dev

# Build for production
npm run build

# Link to Foundry (after npm run build)
npm run link-create
```

## Debugging TODOs

### Find specific TODOs:
```
Ctrl+Shift+F → "// TODO:" → Filter by file
```

### Common TODO Categories:
- **Types**: Define interfaces in turn-prep.types.ts
- **Methods**: Implement class methods in feature files
- **Components**: Build Svelte UI in sheets/components/
- **Integration**: Connect to Foundry/Tidy in sheets/*/

## File Checklist

Each file is complete when:
- [ ] All `// TODO:` comments are addressed
- [ ] Code compiles without TypeScript errors
- [ ] Uses proper logging (not console.log)
- [ ] Exported for use by other modules
- [ ] Has JSDoc comments for public APIs

## Testing in Foundry

1. Run `npm run dev` in terminal
2. Start Foundry (separate window/terminal)
3. Foundry will hot-reload your changes
4. Check browser console (F12) for errors

## Common Patterns to Follow

### Logging
```typescript
import { debug, warn, error } from 'src/utils/logging';
debug('Something happened', { data });
warn('Be careful!');
error('Something broke!');
```

### Storage
```typescript
import { TurnPrepStorage } from 'src/features/data/TurnPrepStorage';
const data = TurnPrepStorage.load(actor);
await TurnPrepStorage.save(actor, data);
```

### Localization
```typescript
import { FoundryAdapter } from 'src/foundry/FoundryAdapter';
const text = FoundryAdapter.localize('TurnPrep.TabName');
```

## Notes

- All files have TODO comments - use them!
- Each TODO describes the implementation requirement
- Files are organized by dependency (implement bottom-up or top-down)
- Check ARCHITECTURE.md for file-to-file relationships
