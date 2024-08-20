'use client';

import SelectCustom from '@/components/common/SelectCustom';
import UploadFile from '@/components/common/UploadFile';
import { productImageAcceptTypes } from '@/constants/common';
import useFetchAllTags from '@/hooks/useFetchAllTags';
import useFetchCategories from '@/hooks/useFetchCategories';
import {
  EThemeStatus,
  ITheme,
  IThemeFeatureType,
  TCreateTheme,
  TCreateThemeSchema
} from '@/models/theme.type';
import { fetchFeatureType } from '@/services/common.service';
import { createTheme, updateTheme, uploadTheme } from '@/services/theme';
import { COLLECTION_NAV_LINKS, EQueryKeys } from '@/types/common';

import {
  ECollectionTab,
  ICreateCollection,
  TCreateCollectionSChema,
  TCreateCollectionSchema
} from '@/models/collection.type';
import { getThemeFeatureIds } from '@/utils/helper';
import { createThemeSchema } from '@/validation/admin/theme.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUploader } from 'react-drag-drop-files';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ImageListType } from 'react-images-uploading';
import CheckIcon from '../../../public/assets/icon/CheckIcon';
import DoubleLine from '../../../public/assets/icon/DoubleLineIcon';
import InputMessage from '../common/InputMessage';
import SelectFeatureTag from '../common/SelectFeatureTag';
import { createCollection } from '@/services/collection';
import { createCollectionSchema } from '@/validation/admin/collection.validation';
import ChooseProductModal from './ChooseProductModal';
import Image from 'next/image';
import CreatorEarning from './CreatorEarning';

interface IProductFormProps {
  themeDetail?: ITheme;
}
export interface IProductSelect {
  id: number;
  thumbnail: string;
}

function CollectionForm({ themeDetail }: IProductFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getValues,
    control
  } = useForm<TCreateCollectionSchema>({
    resolver: yupResolver(createCollectionSchema as any)
  });

  const [fullPreviewImages, setFullPreViewImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState<string>();
  const [tab, setTab] = useState<ECollectionTab>(ECollectionTab.OVERVIEW);
  const [status, setStatus] = useState<EThemeStatus>(EThemeStatus.DRAFT);
  const [fileTypeSelect, setFileTypeSelect] = useState<IThemeFeatureType[]>([]);
  const [collectionId, setCollection] = useState<number>();
  const router = useRouter();
  const [openChooseProductModal, setOpenChooseProductModal] = useState(false);
  const [themeSelect, setThemeSelect] = useState<IProductSelect[]>([]);

  const tabList = [
    ECollectionTab.OVERVIEW,
    ECollectionTab.FEATURES,
    ECollectionTab.CHOOSE_PRODUCTS
  ];
  const isUpdate = useMemo(() => themeDetail, [themeDetail]);

  const { data: featureTypes } = useQuery({
    queryKey: [EQueryKeys.FEATURE_TYPE],
    queryFn: () => fetchFeatureType()
  });

  const queryClient = useQueryClient();

  const { mutate: handleUpdateTheme } = useMutation({
    mutationFn: updateTheme,
    onSuccess: () => {
      message.success('Update theme successfully');
      queryClient.invalidateQueries({ queryKey: [EQueryKeys.YOUR_PRODUCTS] });
      router.push('/admin/your-products', { scroll: false });
    },
    onError: error => {
      message.error(error.message);
    }
  });

  useEffect(() => {
    if (themeDetail) {
      setValue('collection_name', themeDetail.name);
      setValue('description', themeDetail.overview);
      setValue('sellingPricing', Number(themeDetail.sale?.price));
      setValue('ownershipPrice', Number(themeDetail.listing?.price));
      setValue('percentageOfOwnership', themeDetail.percentageOfOwnership);
      setValue('highlights', themeDetail?.media?.highlight);
      setValue('linkPreview', themeDetail?.linkPreview || undefined);
      setValue(
        'collectionCategories',
        themeDetail?.categories?.map(item => item.id)
      );
      setValue(
        'collectionTags',
        themeDetail?.tags?.map(item => item.id)
      );
      setValue('feature_ids', getThemeFeatureIds(themeDetail?.themeFeatures));
      setThumbnail(themeDetail.media.thumbnail);
      setValue('thumbnail', themeDetail?.media.thumbnail);
      setFullPreViewImages(themeDetail?.media?.previews || []);
      setFileTypeSelect(themeDetail?.themeFeatures.map(item => item.type));
    }
  }, [setValue, themeDetail]);

  const { mutate: handleCreateCollection } = useMutation({
    mutationFn: createCollection,
    onSuccess: data => {
      if (status === EThemeStatus.DRAFT) {
        router.push('admin/your-collections', { scroll: false });
        return;
      }
      setCollection(data?.id);

      if (tab !== ECollectionTab.CHOOSE_PRODUCTS) {
        setTab((preState: ECollectionTab) => {
          const currentTabIndex = tabList.indexOf(preState);
          return tabList[currentTabIndex + 1];
        });
      } else {
        message.success('Create theme successfully');
        router.push('/your-collections', { scroll: false });
      }
    },
    onError: error => {
      message.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [EQueryKeys.YOUR_PRODUCTS] });
    }
  });

  const onSubmit: SubmitHandler<any> = async (data: ICreateCollection) => {
    const createCollectionDto: ICreateCollection = {
      ...data
    };
    if (isUpdate) {
      const updateCollection = {
        ...createCollectionDto,
        fullPreviewImages
      };
      //   handleUpdateTheme({
      //     collectionId: Number(themeDetail?.id),
      //     body: updateThemeDto
      //   });
      return;
    }

    if (tab !== ECollectionTab.OVERVIEW) {
      handleCreateCollection({
        ...createCollectionDto,
        colleciton_id: collectionId,
        theme_ids: themeSelect.map(item => `${item.id}`)
      });
      return;
    }

    handleCreateCollection(createCollectionDto);
  };

  const handleChangeThumbnail = async (file: ImageListType) => {
    try {
      const result = await uploadTheme({
        thumbnail: file
      });
      setThumbnail(result.data.thumbnail);
      setValue('thumbnail', result.data.thumbnail);
      message.success('Update thumbnail successfully');
    } catch (err) {
      message.error('Update thumbnail failed');
    }
  };

  const getColorIcon = useCallback((value: string[], index: number) => {
    return isEmpty(value ? value[index] : '') ? '#E4E4E7' : '#4338CA';
  }, []);

  const handleSetThemSelect = useCallback((data: IProductSelect[]) => {
    setThemeSelect(data);
  }, []);

  const { data: themeCategories } = useFetchCategories();
  const { data: themeTags } = useFetchAllTags();

  const NavLinkComponent = () => {
    return (
      <ul className="flex items-center font-medium mt-[32px] gap-10">
        {COLLECTION_NAV_LINKS.map((item, index) => (
          <li
            key={index}
            onClick={() => {
              // if (!isUpdate) return;
              setTab(item.value);
            }}
            className="flex items-center gap-4 cursor-pointer"
          >
            <span
              className={`w-[40px] flex items-center justify-center h-[40px] border border-1 rounded-[50%] ${
                item.value === tab
                  ? 'border-primary text-primary'
                  : 'border-[#6B7280] text-[#6B7280]'
              }`}
            >
              {index + 1}
            </span>
            <p
              className={`${
                item.value === tab ? 'text-primary' : 'text-[#6B7280]'
              }`}
            >
              {item.title}
            </p>
          </li>
        ))}
      </ul>
    );
  };

  const handleSelecFileType = useCallback(
    (typeData: IThemeFeatureType) => {
      const typeExists = fileTypeSelect.find(type => type.id === typeData.id);
      if (typeExists) {
        setFileTypeSelect(preState =>
          preState.filter(type => type !== typeExists)
        );
      } else {
        setFileTypeSelect(preState => [...preState, typeData]);
      }
    },
    [fileTypeSelect]
  );
  const checkFileTypeActive = (typeId: number) =>
    fileTypeSelect?.find(type => type?.id === typeId);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex justify-between">
        <h1 className="text-[#111827] text-3xl not-italic font-bold leading-9">
          {isUpdate ? 'Update product' : 'Add new collection '}
        </h1>
        <div className="text-base not-italic font-semibold leading-6">
          <button
            onClick={() => setStatus(EThemeStatus.DRAFT)}
            className="px-[17px] py-[9px] rounded-[14px] border border-[#D1D5DB] border-1 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            Save as draft
          </button>
          <button
            onClick={() => {
              setStatus(EThemeStatus.PENDING);
            }}
            className="bg-primary text-white px-[17px] py-[9px] rounded-[14px] ml-4"
          >
            {tab === ECollectionTab.CHOOSE_PRODUCTS || isUpdate
              ? 'Submit for review'
              : 'Next step'}
          </button>
        </div>
      </div>
      <NavLinkComponent />

      {tab === ECollectionTab.OVERVIEW && (
        <div className="flex gap-8">
          <div className="basis-3/5">
            <div className="">
              <h1 className="my-6 text-[#111827] text-xl font-medium">
                Product type
              </h1>
              <ul className="flex gap-4">
                <li className="flex w-full cursor-pointer justify-start p-[20px] bg-[#EEF2FF] border-primary border-2 rounded-[8px]">
                  <label
                    className="flex gap-2 cursor-pointer w-full h-full"
                    htmlFor="single-theme"
                  >
                    <div className="pt-1">
                      <img alt="img" src={'/assets/icon/collection-icon.svg'} />
                    </div>
                    <div>
                      <h3 className="font-medium">Collection</h3>

                      <p className="mt-1">
                        Sell two or more existing products as a new pack and new
                        price
                      </p>
                    </div>
                  </label>
                </li>
              </ul>
            </div>
            <div className="">
              <h1 className="my-6 text-[#111827] text-xl font-medium">
                Collection detail detail
              </h1>
              <ul className="flex flex-col gap-4">
                <li className="w-full">
                  <h2 className="mb-1">Name</h2>
                  <Controller
                    name="collection_name"
                    control={control}
                    render={({ field }) => (
                      <Input
                        className="w-[100%] px-[13px] py-[9px] border-[#D1D5DB] border-1 rounded-[8px] outline-[#D1D5DB]"
                        type="text"
                        {...field}
                        status={errors.collection_name?.message ? 'error' : ''}
                      />
                    )}
                  />
                  <InputMessage
                    errorMessage={errors.collection_name?.message}
                  />
                  <span className="text-[#64748B]">Give it a catchy name</span>
                </li>
                <li className="w-full mt-2">
                  <h2 className="mb-1">Description</h2>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextArea
                        className="w-[100%] h-[100px] px-[13px] py-[9px] border-[#D1D5DB] border-1 rounded-[8px] outline-[#D1D5DB]"
                        {...field}
                        status={errors.description?.message ? 'error' : ''}
                      />
                    )}
                  />
                  <InputMessage errorMessage={errors.description?.message} />
                </li>
              </ul>
            </div>
            <div className="">
              <h1 className="my-6 text-[#111827] text-xl font-medium">
                Pricing
              </h1>
              <ul className="flex flex-col gap-4">
                <li className="w-full">
                  <h2 className="mb-1">Selling pricing</h2>
                  <Controller
                    name="sellingPricing"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          status={errors.sellingPricing?.message ? 'error' : ''}
                          size="large"
                          addonBefore="SOL"
                        />
                        <InputMessage
                          errorMessage={errors.sellingPricing?.message}
                        />
                      </div>
                    )}
                  />
                  <span className="text-[#64748B]">
                    How much do you want to sell this?
                  </span>
                </li>
                <li className="w-full">
                  <h2 className="mb-1">Percentage of Ownership</h2>
                  <Controller
                    name="percentageOfOwnership"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          {...field}
                          status={
                            errors.percentageOfOwnership?.message ? 'error' : ''
                          }
                          size="large"
                          addonBefore="%"
                        />
                        <InputMessage
                          errorMessage={errors.percentageOfOwnership?.message}
                        />
                      </div>
                    )}
                  />
                  <span className="text-[#64748B]">
                    How much would you pass with product?
                  </span>
                </li>
                <li className="w-full">
                  <h2 className="mb-1">Ownership price</h2>
                  <Controller
                    name="ownershipPrice"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          className="w-[100%] rounded-r-[8px] outline-[#D1D5DB]"
                          type="text"
                          {...field}
                          size="large"
                          addonBefore="SOL"
                          status={errors.ownershipPrice?.message ? 'error' : ''}
                        />
                        <InputMessage
                          errorMessage={errors.ownershipPrice?.message}
                        />
                      </div>
                    )}
                  />
                  <span className="text-[#64748B]">
                    How much would you pass with product?
                  </span>
                </li>

                <li className="w-full">
                  <div className="flex">
                    <img alt="" src={'/assets/image/admin/note.svg'} />
                    <p className="pl-1">What is ownership?</p>
                  </div>
                  <div className="flex mt-1">
                    <img alt="img" src={'/assets/image/admin/note.svg'} />
                    <p className="pl-1">How my author price being share?</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="basis-2/5">
            <div className="">
              <h1 className="my-6 text-[#111827] text-xl font-medium">
                Thumbnail
              </h1>

              <ul className="flex gap-4 flex-col">
                <FileUploader
                  handleChange={handleChangeThumbnail}
                  name="file"
                  types={productImageAcceptTypes}
                >
                  {thumbnail ? (
                    <img
                      alt="img"
                      className="w-full h-full rounded-2xl object-cover"
                      src={thumbnail}
                    />
                  ) : (
                    <UploadFile
                      customClassname={
                        errors.thumbnail ? 'border-error border-[2px]' : ''
                      }
                    />
                  )}
                </FileUploader>
              </ul>
            </div>
            <div>
              <h1 className="my-6 text-[#111827] text-xl font-medium">
                File type included
              </h1>
              <ul className="flex gap-4 flex-wrap">
                {featureTypes?.map((type: IThemeFeatureType) => (
                  <li
                    key={type.id}
                    onClick={() => handleSelecFileType(type)}
                    className={clsx(
                      'flex gap-4 items-center p-[12px] rounded-[8px] border-[#D1D5DB] border-2 w-[calc(50%-10px)] cursor-pointer',
                      checkFileTypeActive(type.id) && 'bg-indigo-100'
                    )}
                  >
                    <img alt="img" className="w-[16px]" src={type.iconUrl} />
                    <h2>{type.name}</h2>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === ECollectionTab.FEATURES && (
        <div className="flex justify-between gap-[150px] mt-10">
          <div className="flex-1 flex flex-col gap-6">
            <div>
              <p className="font-medium">Highlight Features</p>
              <div className="mt-6">
                <div className="flex flex-col gap-3">
                  <Controller
                    name="highlights"
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <>
                          {new Array(6).fill('').map((_, index) => (
                            <Input
                              key={index}
                              value={value ? value[index] : ''}
                              onChange={e => {
                                const newValue = e.target.value;
                                const draft = value ? [...value] : [];
                                draft[index] = newValue;
                                onChange(draft);
                              }}
                              className="h-[46px]"
                              prefix={
                                <CheckIcon
                                  color={getColorIcon(value ?? [], index)}
                                />
                              }
                              suffix={
                                <DoubleLine
                                  color={getColorIcon(value ?? [], index)}
                                />
                              }
                            />
                          ))}
                        </>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium">Link preview</p>
              <div className="mt-6">
                <div className="flex flex-col gap-3">
                  <Controller
                    name="linkPreview"
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <>
                          <Input
                            placeholder="Link preview"
                            onChange={onChange}
                            value={value}
                            className="h-[46px]"
                            status={errors.linkPreview?.message ? 'error' : ''}
                          />
                        </>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium">Select Category</p>
              <div className="mt-6">
                <div className="flex flex-col gap-3">
                  <Controller
                    name="collectionCategories"
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <SelectCustom
                          options={
                            themeCategories?.map(item => ({
                              label: item.name,
                              value: item.id
                            })) || []
                          }
                          currentValue={value || []}
                          onChange={onChange}
                        />
                      );
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="font-medium">Select Tags</p>
              <div className="mt-6">
                <div className="flex flex-col gap-3">
                  <Controller
                    name="collectionTags"
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <SelectCustom
                          options={
                            themeTags?.map(item => ({
                              label: item.name,
                              value: item.id
                            })) || []
                          }
                          currentValue={value || []}
                          onChange={onChange}
                          tagClassName="bg-indigo-200 text-indigo-800"
                        />
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <Controller
            name="feature_ids"
            control={control}
            render={({ field: { onChange, value } }) => (
              <ul className="flex flex-1 flex-col gap-4">
                {fileTypeSelect.map(type => (
                  <li key={type.id} className="w-full">
                    <h2 className="font-medium mb-6">{type.name}</h2>
                    <SelectFeatureTag
                      onChange={onChange}
                      typeId={type.id}
                      currentValue={value}
                    />
                  </li>
                ))}
              </ul>
            )}
          />
        </div>
      )}

      {tab === ECollectionTab.CREATOR_EARNING && <CreatorEarning />}
      {tab === ECollectionTab.CHOOSE_PRODUCTS && (
        <div className="grid xl:grid-cols-3 sm:grid-cols-2 gap-[32px] mt-[32px]">
          {themeSelect?.map(item => {
            return (
              <div key={item.id}>
                {' '}
                <Image
                  alt="theme-image"
                  src={item.thumbnail}
                  width={370}
                  height={280}
                  className="h-[280px] w-full object-cover rounded-xl"
                />
              </div>
            );
          })}

          <div className="border rounded-2xl p-[32px] h-[280px] ">
            <div
              onClick={() => setOpenChooseProductModal(true)}
              className="m-auto flex flex-col items-center justify-center h-full"
            >
              <img
                className="w-[36px] h-[36px]"
                alt="icon"
                src="/assets/icon/plus-icon.svg"
              />
              <p className="text-gray-600">Choose your product.</p>
            </div>
          </div>
          {openChooseProductModal && (
            <ChooseProductModal
              open={openChooseProductModal}
              themeSelect={themeSelect}
              handleSetThemSelect={handleSetThemSelect}
              onClose={() => setOpenChooseProductModal(false)}
            />
          )}
        </div>
      )}
    </form>
  );
}

export default CollectionForm;
