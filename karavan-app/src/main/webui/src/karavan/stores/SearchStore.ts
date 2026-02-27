/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {SearchResult} from "@models/SearchModels";

interface SearchState {
    search: string;
    setSearch: (search: string) => void;
    searchResults: SearchResult[];
    setSearchResults: (searchResult: SearchResult[]) => void;
}

export const useSearchStore = createWithEqualityFn<SearchState>((set) => ({
    search: '',
    searchResults: [],
    setSearch: (search: string)  => {
        set({search: search})
    },
    setSearchResults: (searchResults: SearchResult[])  => {
        set({searchResults: searchResults})
    },
}), shallow)