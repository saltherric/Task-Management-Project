// Helper to determine the dot color of a column
function getColumnDotProps(col) {
    const name = col.name?.toLowerCase().trim() || '';

    // If the color is customized (i.e. not default white)
    if (col.color && col.color.toLowerCase() !== '#ffffff') {
        return { style: { backgroundColor: col.color }, className: '' };
    }

    // Fallbacks based on name
    if (name.includes('todo') || name.includes('to do')) {
        return { className: 'bg-slate-400' };
    }
    if (name.includes('progress')) {
        return { className: 'bg-blue-500' };
    }
    if (name.includes('review')) {
        return { className: 'bg-amber-500' };
    }
    if (name.includes('done')) {
        return { className: 'bg-emerald-500' };
    }

    // Default fallback
    return { className: 'bg-indigo-500' };
}

export default getColumnDotProps;
