import { useEffect } from "react";

function useClickOutside(ref, callback) {
  useEffect(() => {
    const handleClick = (event) => {
      if (!ref.current?.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [ref, callback]);
}

export {useClickOutside};