# Makhzan

Makhzan (Store or Repository in Arabic) is a Unit of Work and Repository abstraction layer.

currently, only the Unit of Work implementation exists, found inside /packages/core, future goals include 
building a generic repository abstraction for common data layers, including:
- Prisma
- Objection.js
- Mongoose
That would provide the ability to seperate your domain layer from your data layer without compromising in consistency via the Unit of Work pattern.