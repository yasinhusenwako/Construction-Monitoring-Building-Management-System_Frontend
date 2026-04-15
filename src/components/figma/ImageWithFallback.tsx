"use client";

import React, { useState } from "react";
import Image from "next/image";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

export function ImageWithFallback(
  props: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    width?: number | `${number}`;
    height?: number | `${number}`;
  },
) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, fill, width, height, ...rest } = props;

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full relative">
        <Image
          src={ERROR_IMG_SRC}
          alt="Error loading image"
          fill={!width && !height}
          width={width ? Number(width) : fill ? undefined : 88}
          height={height ? Number(height) : fill ? undefined : 88}
          {...(rest as any)}
          data-original-url={src}
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>
  ) : (
    <div className={`relative ${className ?? ""}`} style={style}>
      <Image
        src={src || ERROR_IMG_SRC}
        alt={alt || ""}
        fill={!width && !height}
        width={width ? Number(width) : !fill ? 88 : undefined}
        height={height ? Number(height) : !fill ? 88 : undefined}
        {...(rest as any)}
        onError={handleError}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
