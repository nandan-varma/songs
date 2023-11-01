import { Flex, IconButton, useColorMode } from "@chakra-ui/react";
import { faBars, faHome, faLeftLong, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router"
import { useState } from "react";
import Playlist from "./PlayList";
import { useSearchContext } from "./search/SearchContext";

export const Navbar = () => {
    const router = useRouter();
    const { colorMode, toggleColorMode } = useColorMode();
    const { ResetSearch } = useSearchContext();
    const [togglePlaylist, SetTogglePlaylist] = useState(false);
    return (
        <>
            <Flex justify={'space-around'}>
                <IconButton m={'1'} aria-label='toggle back button' onClick={() => { ResetSearch(); router.back() }} icon={<FontAwesomeIcon icon={faLeftLong} />} />
                <IconButton m={'1'} aria-label='toggle back home' onClick={() => { router.push('/') }} icon={<FontAwesomeIcon icon={faHome} />} />
                <IconButton m={'1'} aria-label='toggle playlist' onClick={() => { SetTogglePlaylist(!togglePlaylist) }} icon={<FontAwesomeIcon icon={faBars} />} />
                <IconButton m={'1'} aria-label='toggle color theme' onClick={toggleColorMode} icon={<FontAwesomeIcon icon={colorMode === 'light' ? faMoon : faSun} />} />
            </Flex>
            {togglePlaylist && <Playlist />}
        </>
    )
}