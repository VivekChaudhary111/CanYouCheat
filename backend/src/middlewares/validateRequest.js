// ...existing code...
module.exports = (requiredFieldsOrFn) => {
  return (req, res, next) => {
    // Resolve required fields from an array or a function(req)
    let requiredFields;
    try {
      requiredFields = typeof requiredFieldsOrFn === 'function'
        ? requiredFieldsOrFn(req)
        : requiredFieldsOrFn;
    } catch (err) {
      return res.status(500).json({ message: 'Validation configuration error' });
    }

    // Ensure we have an array to call .filter on
    if (!Array.isArray(requiredFields)) {
      requiredFields = requiredFields ? [requiredFields] : [];
    }

    // treat undefined, null or empty-string as missing
    const missingFields = requiredFields.filter(field => {
      const v = req.body?.[field];
      return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        missingFields
      });
    }
    next();
  };
};
// ...existing code...