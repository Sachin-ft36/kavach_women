export const loadZegoScript = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).ZegoUIKitPrebuilt) {
      resolve((window as any).ZegoUIKitPrebuilt);
      return;
    }
    const script = document.createElement('script');
    script.src = "https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js";
    script.async = true;
    script.onload = () => resolve((window as any).ZegoUIKitPrebuilt);
    script.onerror = () => reject(new Error("Failed to load ZegoCloud SDK from CDN"));
    document.body.appendChild(script);
  });
};
