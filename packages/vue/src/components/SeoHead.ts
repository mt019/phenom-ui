import { defineComponent, watchEffect, type PropType } from 'vue';
import { useRoute } from 'vue-router';
import { applySeoHead, type SeoItem, type SeoPage, type SeoSite } from '../composables/seoHead';

// 對應 React 版 <SeoHead page site itemList />：不輸出 DOM，路由或 page 變動時改寫 <head>。
// render 回傳 null，避免 SSR 與瀏覽器端的註解節點不一致。
export default defineComponent({
  name: 'SeoHead',
  props: {
    page: Object as PropType<SeoPage>,
    site: { type: Object as PropType<SeoSite>, default: () => ({}) },
    itemList: Array as PropType<SeoItem[]>,
  },
  setup(props) {
    const route = useRoute();
    watchEffect(() => {
      if (typeof document === 'undefined') return;
      applySeoHead({ page: props.page, site: props.site, pathname: route.path, itemList: props.itemList });
    }, { flush: 'post' });
    return () => null;
  },
});
