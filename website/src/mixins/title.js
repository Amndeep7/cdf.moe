const getTitle = (vueThis) => {
  const { title } = vueThis.$options;
  if (title) {
    return `${typeof title === 'function' ? title.call(vueThis) : title} - CDF.MOE`;
  }
  throw new Error('Title was not defined');
};

export default {
  created () {
    const title = getTitle(this);
    if (title) {
      document.title = title;
    }
  },
};
