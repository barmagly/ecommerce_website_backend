const fetchCategories = async () => {
  try {
    setLoading(true);
    const response = await categoryService.getAll();
    // Fix: Use response.data.categories instead of response.data
    setCategories(response.data.categories || []);
  } catch (error) {
    setCategories([]);
    toast.error('حدث خطأ أثناء تحميل التصنيفات');
  } finally {
    setLoading(false);
  }
}; 

 