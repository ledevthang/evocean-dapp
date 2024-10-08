import {
  FetchCollectionParams,
  ICollection,
  ICreateCollection
} from '@/models/collection.type';
import { ListData } from '@/models/common.type';
import api from './axios';
import { ApiCollections } from './route';

export async function createCollection(
  body: ICreateCollection
): Promise<ICollection> {
  return api(ApiCollections.createCollection, body, {
    method: 'POST'
  })
    .then(res => res.data)
    .catch(err => err);
}

export async function updateCollection({
  id,
  body
}: {
  id: number;
  body: ICreateCollection;
}): Promise<ICollection> {
  return api(`${ApiCollections.updateCollection}/${id}`, body, {
    method: 'PUT'
  })
    .then(res => res.data)
    .catch(err => err);
}

export async function fetchCollections(
  params: FetchCollectionParams
): Promise<ListData<ICollection>> {
  return api(ApiCollections.fetchCollections, null, {
    method: 'GET',
    params
  })
    .then(res => res.data)
    .catch(err => err);
}

export const fetchCollection = (collectionId: number): Promise<ICollection> =>
  api(`${ApiCollections.updateCollection}/${collectionId}`, null, {
    method: 'GET'
  }).then(res => res.data);

export const deleteCollection = (collectionId: number): Promise<ICollection> =>
  api(`${ApiCollections.deleteCollection}/${collectionId}`, null, {
    method: 'DELETE'
  }).then(res => res.data);
