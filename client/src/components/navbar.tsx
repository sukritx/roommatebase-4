import React, { useState } from 'react'; // Import useState
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link"; // HeroUI Link for general use
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";
import { useNavigate, Link as RouterLink } from "react-router-dom"; // <--- Import Link as RouterLink

// --- HeroUI Components from their individual packages ---
import {  Dropdown,  DropdownTrigger,  DropdownMenu,  DropdownItem} from "@heroui/dropdown";
import {Avatar} from "@heroui/avatar";

// --- Local Imports ---
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  GithubIcon,
  HeartFilledIcon,
  SearchIcon,
} from "@/components/icons";
import { Logo } from "@/components/icons";
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();
  // State to control mobile menu open/close status
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false); // Close menu on logout
  };

  // Helper function to just close the menu after a router navigation happens
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      isMenuOpen={isMenuOpen} // Pass control state
      onMenuOpenChange={setIsMenuOpen} // Pass state setter
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/" // HeroUI Link can take href for simple links or as={RouterLink} for React Router
          >
            <Logo />
            <p className="font-bold text-inherit">RoommateBase</p>
          </Link>
        </NavbarBrand>
        <div className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium",
                )}
                color="foreground"
                href={item.href} // Default NavItems are usually simple links, can be `as={RouterLink} to={item.href}` if they map to React Router routes
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        {/* Render search input always, adjust visibility with Tailwind */}
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>

        {!loading && (
          isAuthenticated ? (
            // Logged-in user state
            <NavbarItem className="hidden md:flex gap-2 items-center">
              {/* "Create Listing" button for room owner/landlord */}
              {user?.isRoomOwner && (
                 <Button
                  as={Link} // Assuming HeroUI Link can handle 'href' for internal routes or external
                  href="/create-listing"
                  color="primary"
                  variant="solid"
                 >
                   Create Listing
                 </Button>
              )}
              {/* Profile dropdown */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    isBordered
                    as="button"
                    className="transition-transform"
                    color="secondary"
                    name={user?.username || 'User'}
                    size="sm"
                    src={user?.profilePicture || "https://i.pravatar.cc/150?u=a042581f4e29026704d"}
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Profile Actions"
                  variant="flat"
                  onAction={(key) => {
                    if (key === "logout") {
                      handleLogout();
                    } else {
                      navigate(`/${key}`);
                    }
                  }}
                >
                  <DropdownItem key="user-info" className="h-14 gap-2 text-default-500" textValue={`Signed in as ${user?.email}`}>
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold">{user?.email}</p>
                  </DropdownItem>

                  <DropdownItem key="dashboard">
                    Dashboard
                  </DropdownItem>
                  <DropdownItem key="profile">
                    Profile
                  </DropdownItem>
                  <DropdownItem key="wishlists">
                    Wishlists
                  </DropdownItem>

                  {user?.isRoomOwner && (
                    <DropdownItem key="my-listings">
                      My Listings
                    </DropdownItem>
                  )}

                  {siteConfig.navMenuItems
                    .filter(item =>
                      item.href !== "/logout" &&
                      item.href !== "/profile" &&
                      item.href !== "/dashboard" &&
                      item.href !== "/messages" &&
                      item.href !== "/wishlists" &&
                      item.href !== "/my-listings" &&
                      item.href !== "/inbox" &&
                      item.href !== "/projects" &&
                      item.href !== "/team" &&
                      item.href !== "/calendar" &&
                      item.href !== "/settings" &&
                      item.href !== "/help-feedback"
                    )
                    .map((item) => (
                      <DropdownItem key={item.href.replace('/', '')}>
                        {item.label}
                      </DropdownItem>
                  ))}

                  <DropdownItem key="logout" color="danger">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          ) : (
            <NavbarItem className="hidden md:flex gap-2">
              <Button
                as={Link}
                color="primary"
                href="/login"
                variant="solid"
              >
                Sign In
              </Button>
            </NavbarItem>
          )
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <Link isExternal href={siteConfig.links.github}>
          <GithubIcon className="text-default-500" />
        </Link>
        <ThemeSwitch />
        {/* Pass control state to NavbarMenuToggle */}
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="ml-auto"
        />
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {!loading && (
            isAuthenticated ? (
              // Mobile menu items for logged-in user
              <>
                <NavbarMenuItem key="mobile-profile">
                  <Link
                    className="w-full"
                    color="foreground"
                    as={RouterLink} // <--- Use as={RouterLink}
                    to="/profile"   // <--- Use 'to' prop
                    size="lg"
                    onClick={closeMobileMenu} // <--- Close menu directly
                  >
                    Profile
                  </Link>
                </NavbarMenuItem>
                <NavbarMenuItem key="mobile-dashboard">
                  <Link
                    className="w-full"
                    color="foreground"
                    as={RouterLink} // <--- Use as={RouterLink}
                    to="/dashboard"  // <--- Use 'to' prop
                    size="lg"
                    onClick={closeMobileMenu} // <--- Close menu directly
                  >
                    Dashboard
                  </Link>
                </NavbarMenuItem>
                <NavbarMenuItem key="mobile-wishlists">
                  <Link
                    className="w-full"
                    color="foreground"
                    as={RouterLink} // <--- Use as={RouterLink}
                    to="/wishlists" // <--- Use 'to' prop
                    size="lg"
                    onClick={closeMobileMenu} // <--- Close menu directly
                  >
                    Wishlists
                  </Link>
                </NavbarMenuItem>

                {user?.isRoomOwner && (
                  <NavbarMenuItem key="mobile-my-listings">
                    <Link
                      className="w-full"
                      color="foreground"
                      as={RouterLink} // <--- Use as={RouterLink}
                      to="/my-listings" // <--- Use 'to' prop
                      size="lg"
                      onClick={closeMobileMenu} // <--- Close menu directly
                    >
                      My Listings
                    </Link>
                  </NavbarMenuItem>
                )}

                {siteConfig.navMenuItems
                  .filter(item =>
                    item.href !== "/profile" &&
                    item.href !== "/dashboard" &&
                    item.href !== "/wishlists" &&
                    item.href !== "/my-listings" &&
                    item.href !== "/logout" &&
                    item.href !== "/messages" &&
                    item.href !== "/inbox" &&
                    item.href !== "/projects" &&
                    item.href !== "/team" &&
                    item.href !== "/calendar" &&
                    item.href !== "/settings" &&
                    item.href !== "/help-feedback"
                  )
                  .map((item, index) => (
                    <NavbarMenuItem key={`${item.href}-${index}`}>
                      <Link
                        color="foreground"
                        as={RouterLink} // <--- Use as={RouterLink}
                        to={item.href} // <--- Use 'to' prop
                        size="lg"
                        onClick={closeMobileMenu} // <--- Close menu directly
                      >
                        {item.label}
                      </Link>
                    </NavbarMenuItem>
                  ))}
                <NavbarMenuItem key="mobile-logout">
                  <Link
                    className="w-full"
                    color="danger"
                    href="#" // Keep as # because handleLogout is called, which handles closing
                    size="lg"
                    onClick={handleLogout} // handleLogout already closes the menu
                  >
                    Logout
                  </Link>
                </NavbarMenuItem>
              </>
            ) : (
              // Mobile menu items for unauthenticated user
              <>
                <NavbarMenuItem key="mobile-signin">
                  <Link
                    className="w-full"
                    color="primary"
                    as={RouterLink} // <--- Use as={RouterLink}
                    to="/login"    // <--- Use 'to' prop
                    size="lg"
                    onClick={closeMobileMenu} // <--- Close menu directly
                  >
                    Sign In
                  </Link>
                </NavbarMenuItem>
              </>
            )
          )}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};