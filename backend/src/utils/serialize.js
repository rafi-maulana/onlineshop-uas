/**
 * Helper to map database rows / keys to frontend formats (optional serialization)
 */
exports.serializeUser = (user) => {
    if (!user) return null;
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        address: user.address || null,
        role: user.role,
        createdAt: user.created_at
    };
};

exports.serializeProduct = (product) => {
    if (!product) return null;
    return {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        imageUrl: product.image_url,
        description: product.description,
        category: product.category,
        rating: parseFloat(product.rating || 5.0)
    };
};
