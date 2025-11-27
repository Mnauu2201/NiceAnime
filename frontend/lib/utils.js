// Hàm chuyển tên phim thành slug (one-piece, tokyo-revengers)
export function slugify(text) {
    if (!text) return '';

    return text
        .toString()
        .toLowerCase()
        .trim()
        // Chuyển ký tự có dấu thành không dấu
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Thay khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        // Loại bỏ nhiều dấu gạch ngang liên tiếp
        .replace(/\-\-+/g, '-')
        // Loại bỏ dấu gạch ngang ở đầu và cuối
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

