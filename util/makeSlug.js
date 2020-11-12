function makeSlug(text) {
    var slug = text.replace(/[^a-z0-9- .]/gi, '').trim().replace(/\s+/g, '_').replace(/\./g, '_').toLowerCase();

    if (slug.startsWith('team_')) {
        slug = slug.slice(5);
    }

    return slug;
}

module.exports = {makeSlug};
