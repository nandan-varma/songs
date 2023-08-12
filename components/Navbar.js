import { Flex, IconButton, useColorMode } from "@chakra-ui/react";
import { faLeftLong, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router"

export const Navbar = () => {
    const router = useRouter();
    const { colorMode, toggleColorMode } = useColorMode();
    return (
        <>
        <Flex justify={'space-around'}>
            <IconButton m={'1'} aria-label='toggle back button' onClick={()=>{router.back()}} icon={<FontAwesomeIcon icon={faLeftLong} />}/>
            <IconButton m={'1'} aria-label='toggle color theme' onClick={toggleColorMode} icon={<FontAwesomeIcon icon={colorMode === 'light' ? faMoon : faSun} />}/>
        </Flex>
        </>
    )
}