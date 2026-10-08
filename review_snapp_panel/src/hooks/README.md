# React Query Listing Hooks

This directory contains reusable React Query hooks for creating listings with pagination, search, and filtering capabilities.

## Overview

The listing hooks provide a consistent pattern for fetching and displaying data with React Query. They support both paginated listings with search/filtering and simple listings without pagination.

## Available Hooks

### `useListing<T>`

A hook for paginated listings with search, sorting, and filtering capabilities.

**Parameters:**

- `queryKey`: Array of strings for React Query cache key
- `queryFn`: Function that fetches data with parameters
- `params`: Optional parameters for pagination, search, sorting, etc.
- `enabled`: Optional boolean to enable/disable the query
- `staleTime`: Optional time in milliseconds before data is considered stale
- `refetchOnWindowFocus`: Optional boolean to control refetch behavior

**Returns:**

- `data`: The fetched data with pagination info
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Function to manually refetch data

### `useSimpleListing<T>`

A hook for simple listings without pagination.

**Parameters:**

- `queryKey`: Array of strings for React Query cache key
- `queryFn`: Function that fetches data
- `enabled`: Optional boolean to enable/disable the query
- `staleTime`: Optional time in milliseconds before data is considered stale
- `refetchOnWindowFocus`: Optional boolean to control refetch behavior

**Returns:**

- `data`: The fetched data array
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Function to manually refetch data

## Types

### `ListingParams`

```typescript
interface ListingParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any; // Allow additional filters
}
```

### `ListingResponse<T>`

```typescript
interface ListingResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

## Usage Examples

### 1. Paginated Listing with Search and Filters

```typescript
// API Service
const apiService = {
  getItems: async (params: ListingParams): Promise<ListingResponse<Item>> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.append('page', params.page.toString());
    if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`items?${searchParams.toString()}`).json();
    return response as ListingResponse<Item>;
  }
};

// Hook
export const useItems = (params?: ListingParams) => {
  return useListing<Item>({
    queryKey: ['items'],
    queryFn: apiService.getItems,
    params
  });
};

// Component Usage
function ItemsList() {
  const [params, setParams] = useState<ListingParams>({
    page: 0,
    limit: 10,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const { data, isLoading, error } = useItems(params);

  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, page: 0 }));
  };

  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page: page - 1 }));
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <div>
      <TextField
        value={params.search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search items..."
      />

      <Table>
        {data?.data.map(item => (
          <TableRow key={item.id}>
            <TableCell>{item.title}</TableCell>
          </TableRow>
        ))}
      </Table>

      <Pagination
        count={data?.totalPages || 0}
        page={(params.page || 0) + 1}
        onChange={(e, page) => handlePageChange(page)}
      />
    </div>
  );
}
```

### 2. Simple Listing without Pagination

```typescript
// API Service
const apiService = {
  getAllItems: async (): Promise<Item[]> => {
    return api.get('items/all').json();
  }
};

// Hook
export const useAllItems = () => {
  return useSimpleListing<Item>({
    queryKey: ['items', 'all'],
    queryFn: apiService.getAllItems
  });
};

// Component Usage
function SimpleItemsList() {
  const { data: items, isLoading, error } = useAllItems();

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Grid container spacing={3}>
      {items?.map(item => (
        <Grid item key={item.id}>
          <Card>
            <CardContent>
              <Typography>{item.title}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
```

### 3. Single Item Hook

```typescript
// Hook
export const useItem = (id: string) => {
  return useQuery<Item>({
    queryKey: ['items', id],
    queryFn: () => apiService.getItem(id),
    enabled: !!id
  });
};

// Component Usage
function ItemDetail({ id }: { id: string }) {
  const { data: item, isLoading, error } = useItem(id);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!item) return <Typography>Item not found</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{item.title}</Typography>
        <Typography>{item.description}</Typography>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

1. **Query Keys**: Use consistent, hierarchical query keys for better cache management
2. **Error Handling**: Always handle loading and error states in your components
3. **Pagination**: Reset to page 0 when applying new filters or search
4. **Stale Time**: Set appropriate stale times based on your data update frequency
5. **TypeScript**: Use proper TypeScript types for better development experience
6. **Debouncing**: Consider debouncing search inputs for better performance

## Example Implementation

See the example implementation in:

- `src/app/(control-panel)/apps/example/api/services/exampleApiService.ts`
- `src/app/(control-panel)/apps/example/api/hooks/items/useItems.ts`
- `src/app/(control-panel)/apps/example/ExampleListing.tsx`
- `src/app/(control-panel)/apps/example/SimpleExample.tsx`

These files demonstrate a complete implementation of the listing hooks with a data table, search functionality, pagination, and a simple card-based layout.
