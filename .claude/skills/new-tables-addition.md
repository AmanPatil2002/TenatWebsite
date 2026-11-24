# New Tables Addition

## Process for Adding New Dynamic Data Tables

### 1. Backend Setup
- Create Mongoose model in `backend/models/`
- Add route in `backend/routes/`
- Implement controller in `backend/controller/`
- Add validation middleware
- Register in `backend/server.js` or route index

### 2. Access Control
- Add table name to `frontend/src/config/readOnlyTables.js` if read-only
- Update backend `assertWritable` checks in `siteDataController.js`
- Define permissions: admin-only, editor, or public read

### 3. Frontend Integration
- Add route in `App.jsx` with dynamic parameter (`/admin/data/:tableName`)
- Update `SiteAdminData.jsx` to handle new table
- Add table to navigation/menu in `SiteAdminLayout.jsx`
- Create/update components in `Mycomponent/` as needed

### 4. Data Hydration
- Ensure `buildPageContent.js` can handle new table structure
- Test client-side data fetching and rendering
- Verify pagination, sorting, filtering work

### 5. Testing Checklist
- [ ] CRUD operations work end-to-end
- [ ] Permissions enforced correctly (frontend + backend)
- [ ] Data validation on create/update
- [ ] Error handling for edge cases
- [ ] Responsive UI for table views
- [ ] Theme compatibility

### 6. Documentation
- Update API documentation
- Add to admin user guide
- Document any special behaviors

## Example: Adding a "Products" Table

1. **Backend Model**: `backend/models/Product.js`
2. **Controller**: `backend/controller/productController.js`
3. **Route**: `backend/routes/productRoutes.js`
4. **Frontend Config**: Add to `readOnlyTables.js` if needed
5. **Admin UI**: Table appears in `/admin/data/products`
6. **Test**: Full CRUD cycle with permissions