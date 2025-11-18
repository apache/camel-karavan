import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {SearchResult} from "./SearchModels";

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