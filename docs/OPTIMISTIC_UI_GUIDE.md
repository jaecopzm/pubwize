# Optimistic UI Implementation Guide

## Overview
Optimistic UI provides instant feedback to users by updating the interface immediately, before waiting for server confirmation. This creates a snappier, more responsive experience.

## Core Concepts

### What is Optimistic UI?
Instead of:
1. User clicks "Save"
2. Show loading spinner
3. Wait for server response
4. Update UI

We do:
1. User clicks "Save"
2. Update UI immediately (optimistic)
3. Send request to server in background
4. Confirm or rollback based on response

### When to Use
✅ **Good candidates**:
- Creating new items (articles, sites, calendar events)
- Updating existing data (article content, settings)
- Deleting items
- Toggling states (favorites, publish status)
- Form submissions

❌ **Avoid for**:
- Payment processing
- Critical security operations
- Complex validations
- Operations that frequently fail

## Implementation

### 1. Basic Optimistic Mutation

```typescript
import { useOptimisticMutation } from '@/lib/hooks/use-optimistic-mutation';

function MyComponent() {
  const [items, setItems] = useState([]);

  const { mutate, isLoading, isOptimistic } = useOptimisticMutation({
    mutationFn: async (newItem) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      return response.json();
    },
    optimisticUpdate: (newItem) => {
      // Update UI immediately
      setItems(prev => [newItem, ...prev]);
    },
    rollback: () => {
      // Rollback on error
      setItems(prev => prev.slice(1));
    },
    successMessage: 'Item created!',
    errorMessage: 'Failed to create item',
  });

  const handleCreate = () => {
    mutate({
      id: `temp-${Date.now()}`,
      name: 'New Item',
      createdAt: new Date(),
    });
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isLoading}>
        Create Item
      </button>
      {isOptimistic && <span>Saving...</span>}
    </div>
  );
}
```

### 2. Optimistic List Management

```typescript
import { useOptimisticList } from '@/lib/hooks/use-optimistic-mutation';

function ItemList() {
  const {
    data,
    addOptimistic,
    removeOptimistic,
    updateOptimistic,
    confirmOptimistic,
    rollbackOptimistic,
    isOptimistic,
  } = useOptimisticList(initialItems);

  const handleCreate = async (newItem) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...newItem, id: tempId };

    // Add optimistically
    addOptimistic(optimisticItem);

    try {
      // Create on server
      const response = await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(newItem),
      });
      const result = await response.json();

      // Confirm with real ID
      confirmOptimistic(tempId, { id: result.id });
    } catch (error) {
      // Rollback on error
      rollbackOptimistic(tempId);
      toast.error('Failed to create item');
    }
  };

  return (
    <div>
      {data.map(item => (
        <div 
          key={item.id}
          className={isOptimistic(item.id) ? 'opacity-60' : ''}
        >
          {item.name}
          {isOptimistic(item.id) && <Loader />}
        </div>
      ))}
    </div>
  );
}
```

### 3. Auto-Save with Optimistic Updates

```typescript
import { useAutoSave } from '@/lib/hooks/use-auto-save';
import { AutoSaveStatus } from '@/components/ui/optimistic-indicator';

function ArticleEditor() {
  const [content, setContent] = useState('');

  const { isSaving, lastSaved, hasUnsavedChanges, saveNow } = useAutoSave({
    data: content,
    saveFn: async (data) => {
      await fetch('/api/articles/123', {
        method: 'PATCH',
        body: JSON.stringify({ content: data }),
      });
    },
    delay: 2000, // Save 2 seconds after user stops typing
    onSaveSuccess: () => {
      toast.success('Saved!', { duration: 1000 });
    },
  });

  return (
    <div>
      <AutoSaveStatus
        isSaving={isSaving}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
      />

      <button onClick={saveNow}>
        Save Now
      </button>
    </div>
  );
}
```

### 4. Visual Feedback Components

```typescript
import { 
  OptimisticIndicator,
  OptimisticListItem 
} from '@/components/ui/optimistic-indicator';

// Simple indicator
<OptimisticIndicator
  isOptimistic={isOptimistic}
  isLoading={isLoading}
  hasError={hasError}
/>

// List item wrapper
<OptimisticListItem isOptimistic={isOptimistic(item.id)}>
  <ItemCard item={item} />
</OptimisticListItem>
```

## Real-World Examples

### Example 1: Creating a New Site

```typescript
function CreateSiteButton() {
  const [sites, setSites] = useState([]);

  const { mutate, isLoading } = useOptimisticMutation({
    mutationFn: async (siteData) => {
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      });
      
      if (!response.ok) throw new Error('Failed to create site');
      return response.json();
    },
    optimisticUpdate: (siteData) => {
      // Add to list immediately
      const optimisticSite = {
        ...siteData,
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
      };
      setSites(prev => [optimisticSite, ...prev]);
    },
    rollback: () => {
      // Remove the optimistic item
      setSites(prev => prev.slice(1));
    },
    onSuccess: (result, siteData) => {
      // Replace temp ID with real ID
      setSites(prev => 
        prev.map(site => 
          site.id.startsWith('temp-') 
            ? { ...site, id: result.siteId }
            : site
        )
      );
    },
    successMessage: 'Site created successfully!',
    errorMessage: 'Failed to create site',
  });

  const handleCreate = () => {
    mutate({
      domain: 'example.com',
      siteName: 'My Site',
      niche: 'Technology',
    });
  };

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Site'}
    </button>
  );
}
```

### Example 2: Calendar Event Scheduling

```typescript
function ScheduleArticle({ articleId }) {
  const [events, setEvents] = useState([]);

  const { mutate } = useOptimisticMutation({
    mutationFn: async ({ date }) => {
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/articles/${articleId}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scheduledDate: date }),
      });
      
      if (!response.ok) throw new Error('Failed to schedule');
      return response.json();
    },
    optimisticUpdate: ({ date }) => {
      // Add to calendar immediately
      const optimisticEvent = {
        id: `temp-${Date.now()}`,
        articleId,
        scheduledDate: date,
        status: 'scheduled',
      };
      setEvents(prev => [...prev, optimisticEvent]);
    },
    rollback: () => {
      // Remove from calendar
      setEvents(prev => prev.filter(e => !e.id.startsWith('temp-')));
    },
    successMessage: 'Article scheduled!',
  });

  return (
    <DatePicker
      onSelect={(date) => mutate({ date })}
    />
  );
}
```

### Example 3: Article Content Auto-Save

```typescript
function ArticleEditor({ articleId, initialContent }) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState('');

  const { isSaving, lastSaved, hasUnsavedChanges } = useAutoSave({
    data: { content, title },
    saveFn: async (data) => {
      const auth = getFirebaseAuth();
      const token = await auth.currentUser?.getIdToken();
      
      await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
    delay: 2000,
    onSaveSuccess: () => {
      // Optional: Show subtle success indicator
      console.log('Saved!');
    },
    onSaveError: (error) => {
      toast.error('Failed to save changes');
    },
  });

  return (
    <div className="space-y-4">
      {/* Auto-save status */}
      <div className="flex items-center justify-between">
        <h1>Edit Article</h1>
        <AutoSaveStatus
          isSaving={isSaving}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>

      {/* Editor */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Article title..."
      />
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        className="min-h-[500px]"
      />
    </div>
  );
}
```

## Best Practices

### 1. Always Provide Rollback
```typescript
// ✅ Good - has rollback
optimisticUpdate: (data) => addItem(data),
rollback: () => removeLastItem(),

// ❌ Bad - no rollback
optimisticUpdate: (data) => addItem(data),
```

### 2. Use Temporary IDs
```typescript
// ✅ Good - unique temp ID
const tempId = `temp-${Date.now()}-${Math.random()}`;

// ❌ Bad - might conflict
const tempId = 'temp';
```

### 3. Show Visual Feedback
```typescript
// ✅ Good - clear visual state
<div className={isOptimistic ? 'opacity-60' : ''}>
  {item.name}
  {isOptimistic && <Loader />}
</div>

// ❌ Bad - no feedback
<div>{item.name}</div>
```

### 4. Handle Errors Gracefully
```typescript
// ✅ Good - user-friendly error
onError: (error) => {
  rollback();
  toast.error('Failed to save. Please try again.');
},

// ❌ Bad - silent failure
onError: (error) => console.error(error),
```

### 5. Debounce Frequent Updates
```typescript
// ✅ Good - debounced auto-save
useAutoSave({ data, saveFn, delay: 2000 });

// ❌ Bad - saves on every keystroke
onChange={(e) => {
  setValue(e.target.value);
  save(e.target.value); // Too frequent!
}}
```

## Animations & Transitions

### Success Animation
```typescript
<div className="animate-scale-bounce">
  Item created!
</div>
```

### Error Animation
```typescript
<div className="animate-shake">
  Failed to save
</div>
```

### Smooth Transitions
```typescript
<div className="transition-smooth hover:scale-105">
  Interactive element
</div>
```

### Staggered List Animation
```typescript
{items.map((item, index) => (
  <div
    key={item.id}
    className="animate-slide-in-up"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {item.name}
  </div>
))}
```

## Testing Optimistic UI

### Test Scenarios
1. **Happy Path**: Operation succeeds
2. **Error Path**: Operation fails, rollback works
3. **Network Delay**: Long response time
4. **Rapid Actions**: Multiple quick operations
5. **Offline**: No network connection

### Example Test
```typescript
describe('Optimistic Site Creation', () => {
  it('should add site immediately', () => {
    const { getByText, getByRole } = render(<CreateSite />);
    
    fireEvent.click(getByRole('button', { name: /create/i }));
    
    // Should appear immediately
    expect(getByText('New Site')).toBeInTheDocument();
    expect(getByText('New Site')).toHaveClass('opacity-60');
  });

  it('should rollback on error', async () => {
    server.use(
      rest.post('/api/sites', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const { getByText, queryByText, getByRole } = render(<CreateSite />);
    
    fireEvent.click(getByRole('button', { name: /create/i }));
    
    // Should appear immediately
    expect(getByText('New Site')).toBeInTheDocument();
    
    // Should disappear after error
    await waitFor(() => {
      expect(queryByText('New Site')).not.toBeInTheDocument();
    });
  });
});
```

The same principles apply when editing an existing site. You can optimistically update the UI on `PATCH /api/sites/:id` with the new values and roll back if the network request fails. In tests you would mock `rest.patch('/api/sites/:id', ...)` accordingly.


## Performance Considerations

### 1. Avoid Re-renders
```typescript
// ✅ Good - memoized
const handleCreate = useCallback(() => {
  mutate(data);
}, [data, mutate]);

// ❌ Bad - creates new function every render
const handleCreate = () => mutate(data);
```

### 2. Batch Updates
```typescript
// ✅ Good - single state update
setItems(prev => [...prev, item1, item2, item3]);

// ❌ Bad - multiple updates
setItems(prev => [...prev, item1]);
setItems(prev => [...prev, item2]);
setItems(prev => [...prev, item3]);
```

### 3. Debounce Auto-Save
```typescript
// ✅ Good - 2 second delay
useAutoSave({ data, saveFn, delay: 2000 });

// ❌ Bad - saves too frequently
useAutoSave({ data, saveFn, delay: 100 });
```

## Accessibility

### 1. Announce Changes
```typescript
<div role="status" aria-live="polite">
  {isSaving && 'Saving...'}
  {lastSaved && `Saved at ${formatTime(lastSaved)}`}
</div>
```

### 2. Keyboard Support
```typescript
<button
  onClick={handleSave}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSave();
    }
  }}
>
  Save
</button>
```

### 3. Focus Management
```typescript
// Return focus after optimistic action
const buttonRef = useRef<HTMLButtonElement>(null);

const handleCreate = async () => {
  await mutate(data);
  buttonRef.current?.focus();
};
```

## Troubleshooting

### Issue: Rollback not working
**Solution**: Ensure you're storing the previous state before optimistic update

### Issue: Duplicate items after success
**Solution**: Replace temp ID with real ID instead of adding new item

### Issue: UI flickers
**Solution**: Add smooth transitions and proper loading states

### Issue: Race conditions
**Solution**: Use request IDs and cancel outdated requests

## Resources

- [React Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [SWR Optimistic UI](https://swr.vercel.app/docs/mutation#optimistic-updates)
- [Optimistic UI Patterns](https://www.smashingmagazine.com/2016/11/true-lies-of-optimistic-user-interfaces/)

## Next Steps

1. Implement optimistic updates in articles page
2. Add auto-save to article editor
3. Implement optimistic calendar scheduling
4. Add optimistic site creation
5. Test all optimistic flows thoroughly
