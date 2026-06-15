import { useEffect, useRef } from "react";

function useAutoSave(
  value,
  callback,
  delay = 1000
) {
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      callback();
    }, delay);

    return () => clearTimeout(timer);
  }, [value]);
}

export default useAutoSave;