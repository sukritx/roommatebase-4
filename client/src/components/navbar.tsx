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
// Ensure these imports are correct based on your actual Heroui installation
import {  Dropdown,  DropdownTrigger,  DropdownMenu,  DropdownSection,  DropdownItem} from "@heroui/dropdown";
import {Avatar, AvatarGroup, AvatarIcon} from "@heroui/avatar";

// --- Local Imports ---
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
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
          <Link isExternal href={siteConfig.links.twitter} title="Twitter">
            <TwitterIcon className="text-default-500" />
          </Link>
          <Link isExternal href={siteConfig.links.discord} title="Discord">
            <DiscordIcon className="text-default-500" />
          </Link>
          <Link isExternal href={siteConfig.links.github} title="GitHub">
            <GithubIcon className="text-default-500" />
          </Link>
          <ThemeSwitch />
        </NavbarItem>
        {/* Render search input always, adjust visibility with Tailwind */}
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>

        {/* Conditional rendering for login/profile */}
        {!loading && ( // Ensure auth state is loaded before rendering
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
                    src={user?.profilePicture || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} // Fallback avatar
                  />
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Profile Actions"
                  variant="flat"
                  onAction={(key) => {
                    if (key === "logout") {
                      handleLogout();
                    } else {
                      navigate(`/${key}`); // Handles profile, dashboard, messages etc.
                    }
                  }}
                >
                  <DropdownItem key="user-info" className="h-14 gap-2 text-default-500" textValue={`Signed in as ${user?.email}`}>
                    <p className="font-semibold">Signed in as</p>
                    <p className="font-semibold">{user?.email}</p>
                  </DropdownItem>
                  {/* Map navMenuItems from siteConfig.js, FILTERING OUT LOGOUT AND PROFILE */}
                  {siteConfig.navMenuItems
                    .filter(item => item.href !== "/logout" && item.href !== "/profile")
                    .map((item) => (
                      <DropdownItem key={item.href.replace('/', '')}>
                        {item.label}
                      </DropdownItem>
                  ))}
                  {/* Dedicated Logout DropdownItem to ensure unique key */}
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
                href="/login" // Directs to the login page, where user can choose to register
                variant="solid" // Solid button for a prominent "Sign In"
              >
                Sign In
              </Button>
            </NavbarItem>
          )
        )}
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        {/* Social Icons for mobile (optional, can be moved) */}
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
                <NavbarMenuItem key="mobile-profile"> {/* Unique key for mobile profile */}
                  <Link
                    className="w-full"
                    color="foreground"
                    href="/profile" // Link to actual profile page
                    size="lg"
                  >
                    Profile
                  </Link>
                </NavbarMenuItem>
                {/* Map navMenuItems from siteConfig.js, FILTERING OUT LOGOUT AND PROFILE */}
                {siteConfig.navMenuItems
                  .filter(item => item.href !== "/profile" && item.href !== "/logout")
                  .map((item, index) => (
                    <NavbarMenuItem key={`${item.href}-${index}`}> {/* Unique key for each item */}
                      <Link
                        color="foreground" // Or other color
                        href="#" // Use # for onClick handling to prevent full page reload
                        size="lg"
                        onClick={() => {
                          navigate(item.href); // Navigate for other items
                        }}
                      >
                        {item.label}
                      </Link>
                    </NavbarMenuItem>
                  ))}
                {/* Dedicated Logout NavbarMenuItem for mobile */}
                <NavbarMenuItem key="mobile-logout"> {/* Unique key for mobile logout */}
                  <Link
                    className="w-full"
                    color="danger" // Danger color for logout
                    href="#"
                    size="lg"
                    onClick={handleLogout}
                  >
                    Logout
                  </Link>
                </NavbarMenuItem>
              </>
            ) : (
              // Mobile menu items for unauthenticated user (single "Sign In" button)
              <>
                <NavbarMenuItem key="mobile-signin"> {/* Unique key for mobile signin */}
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