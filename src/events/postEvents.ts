// Custom event for post deletion
export const POST_DELETED_EVENT = 'post-deleted';

export const emitPostDeleted = (postId: string) => {
  const event = new CustomEvent(POST_DELETED_EVENT, { detail: { postId } });
  window.dispatchEvent(event);
};

export const onPostDeleted = (callback: (postId: string) => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail.postId);
  };
  
  window.addEventListener(POST_DELETED_EVENT, handler);
  return () => window.removeEventListener(POST_DELETED_EVENT, handler);
}; 