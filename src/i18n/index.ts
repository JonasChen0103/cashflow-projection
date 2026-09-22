import { createContext, useContext } from 'react';
import type { Lang } from '../lib/types';
import zh from './zh-TW';
import en from './en';

export const dicts = { zh, en } as const;
export type Dict = typeof zh;

export const LangContext = createContext<{
  lang: Lang;
  t: Dict;
  setLang: (l: Lang) => void;
}>({ lang: 'zh', t: zh, setLang: () => {} });

export const useLang = () => useContext(LangContext);
