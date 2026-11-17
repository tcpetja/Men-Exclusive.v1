-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "focusX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "focusY" INTEGER NOT NULL DEFAULT 45;

-- Frame the starter photographs on the suit (measured from each photograph).
UPDATE "ProductImage" SET "focusX" = 68, "focusY" = 62 WHERE "url" = '/products/black-three-piece-suit-scoop-waistcoat.jpg';
UPDATE "ProductImage" SET "focusX" = 69, "focusY" = 64 WHERE "url" = '/products/black-three-piece-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 72, "focusY" = 57 WHERE "url" = '/products/blush-double-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 73, "focusY" = 59 WHERE "url" = '/products/citron-double-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 67, "focusY" = 63 WHERE "url" = '/products/cocoa-double-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 62, "focusY" = 64 WHERE "url" = '/products/forest-green-three-piece-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 59, "focusY" = 63 WHERE "url" = '/products/ivory-double-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 50, "focusY" = 60 WHERE "url" = '/products/ivory-windowpane-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 50, "focusY" = 62 WHERE "url" = '/products/lilac-single-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 63, "focusY" = 66 WHERE "url" = '/products/navy-rust-windowpane-three-piece-suit-2.jpg';
UPDATE "ProductImage" SET "focusX" = 68, "focusY" = 56 WHERE "url" = '/products/navy-rust-windowpane-three-piece-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 70, "focusY" = 58 WHERE "url" = '/products/navy-single-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 70, "focusY" = 56 WHERE "url" = '/products/sage-single-breasted-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 72, "focusY" = 58 WHERE "url" = '/products/stone-check-three-piece-suit.jpg';
UPDATE "ProductImage" SET "focusX" = 72, "focusY" = 60 WHERE "url" = '/products/terracotta-double-breasted-suit.jpg';
