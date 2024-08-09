import Image from 'next/image';
import React from 'react';
import { ExclamationCircleOutlined } from '@ant-design/icons';

export default function UploadFile() {
  return (
    <div className="relative cursor-pointer flex flex-col items-center w-full bg-gray-50 py-[100px] border-dashed border-[1px] border-gray-300 rounded-[20px]">
      <div className="absolute right-0 top-[-44px]">
        <ExclamationCircleOutlined className="text-gray-600 w-[20px] h-[20px]" />
        <span className="text-slate-600 text-[16px]">Required</span>
      </div>
      <Image
        alt="uploadIcon"
        src={'/assets/icon/uploadIcon.svg'}
        width={40}
        height={50}
      />
      <span className="text-gray-600">
        Drag & drop image or click on to upload.{' '}
      </span>
      <span className="text-gray-600">
        Image 1208x840px size required in PNG or JPG format only.
      </span>
    </div>
  );
}