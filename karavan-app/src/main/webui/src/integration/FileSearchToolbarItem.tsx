import React, {useEffect} from 'react';
import {Button, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities} from '@patternfly/react-core';
import {shallow} from "zustand/shallow";
import "./devmode.css"
import {useSearchStore} from "@/api/SearchStore";
import {SearchApi} from "@/api/SearchApi";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {useDebounceValue} from "usehooks-ts";

export function FileSearchToolbarItem() {

    const [search, setSearch, setSearchResults] = useSearchStore((s) => [s.search, s.setSearch, s.setSearchResults], shallow)
    const [debouncedSearch] = useDebounceValue(search, 300);

    useEffect(() => {
        if (search !== undefined && search !== '') {
            SearchApi.searchAll(search, response => {
                if (response) {
                    setSearchResults(response);
                }
            })
        } else {
            setSearchResults([])
        }
    }, [debouncedSearch]);

    function searchInput() {
        return (
            <TextInputGroup className="search">
                <TextInputGroupMain
                    id="search-input"
                    value={search}
                    placeholder='Search'
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    onChange={(_event, value) => {
                        setSearch(value);
                    }}
                    aria-label="text input example"
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" onClick={_ => {
                        setSearch('');
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    return (searchInput())
}