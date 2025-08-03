import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
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
import { useNavigate } from "react-router-dom";

// --- HeroUI Components from their individual packages ---
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";


// --- Local Imports ---
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  GithubIcon, // KEPT
  HeartFilledIcon,
  SearchIcon,
} from "@/components/icons";
import { Logo } from "@/components/icons";
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
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
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            color="foreground"
            href="/"
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
                href={item.href}
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
          {/* Only Github remains from social icons */}
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>

        {!loading && (
          isAuthenticated ? (
            // Logged-in user state
            <NavbarItem className="hidden md:flex gap-2 items-center">
              {/* "Create Listing" button for room owner/landlord */}
              {user?.isRoomOwner && (
                 <Button
                  as={Link}
                  href="/create-listing" // This route needs to be defined
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

                  {/* Landlord Specific Items (if user is room owner) */}
                  {user?.isRoomOwner && (
                    <DropdownItem key="my-listings">
                      My Listings
                    </DropdownItem>
                  )}

                  {/* Filtered Site-Config Menu Items (remaining generic links) */}
                  {siteConfig.navMenuItems
                    .filter(item =>
                      item.href !== "/logout" &&
                      item.href !== "/profile" &&
                      item.href !== "/dashboard" &&
                      item.href !== "/messages" && // These are implicitly filtered by not being explicitly added above
                      item.href !== "/wishlists" &&
                      item.href !== "/my-listings" &&
                      item.href !== "/inbox" &&
                      item.href !== "/projects" && // Assuming these were examples from Heroui template
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

                  {/* Dedicated Logout DropdownItem */}
                  <DropdownItem key="logout" color="danger">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          ) : (
            // No-login state: Show single "Sign In" button
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
        <NavbarMenuToggle />
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
                  <Link className="w-full" color="foreground" href="/profile" size="lg">
                    Profile
                  </Link>
                </NavbarMenuItem>
                <NavbarMenuItem key="mobile-dashboard">
                  <Link className="w-full" color="foreground" href="/dashboard" size="lg">
                    Dashboard
                  </Link>
                </NavbarMenuItem>
                <NavbarMenuItem key="mobile-wishlists">
                  <Link className="w-full" color="foreground" href="/wishlists" size="lg">
                    Wishlists
                  </Link>
                </NavbarMenuItem>

                {/* Landlord Specific Items for Mobile */}
                {user?.isRoomOwner && (
                  <NavbarMenuItem key="mobile-my-listings">
                    <Link className="w-full" color="foreground" href="/my-listings" size="lg">
                      My Listings
                    </Link>
                  </NavbarMenuItem>
                )}

                {/* Filtered Site-Config Menu Items for Mobile */}
                {siteConfig.navMenuItems
                  .filter(item =>
                    item.href !== "/profile" &&
                    item.href !== "/dashboard" &&
                    item.href !== "/wishlists" &&
                    item.href !== "/my-listings" &&
                    item.href !== "/logout" &&
                    item.href !== "/messages" && // Filtered out
                    item.href !== "/inbox" && // Filtered out
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
                        href="#"
                        size="lg"
                        onClick={() => navigate(item.href)}
                      >
                        {item.label}
                      </Link>
                    </NavbarMenuItem>
                  ))}
                {/* Dedicated Logout NavbarMenuItem for mobile */}
                <NavbarMenuItem key="mobile-logout">
                  <Link
                    className="w-full"
                    color="danger"
                    href="#"
                    size="lg"
                    onClick={handleLogout}
                  >
                    Logout
                  </Link>
                </NavbarMenuItem>
              </>
            ) : (
              // Mobile menu items for unauthenticated user
              <>
                <NavbarMenuItem key="mobile-signin">
                  <Link className="w-full" color="primary" href="/login" size="lg">
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