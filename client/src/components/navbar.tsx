import { Button } from "@heroui/button"; // From @heroui/button
import { Kbd } from "@heroui/kbd";       // From @heroui/kbd
import { Input } from "@heroui/input";   // From @heroui/input
import { Link } from "@heroui/link";     // From @heroui/link
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar"; // Only Navbar-specific components from @heroui/navbar
import { link as linkStyles } from "@heroui/theme"; // From @heroui/theme (for Tailwind variants)
import clsx from "clsx"; // For conditional class names
import { useNavigate } from "react-router-dom"; // For programmatic navigation

// --- HeroUI Components from @heroui/react (or your main HeroUI package) ---
// If these are NOT from @heroui/react, adjust paths like "@heroui/avatar", "@heroui/dropdown" etc.
import {  Dropdown,  DropdownTrigger,  DropdownMenu,  DropdownSection,  DropdownItem} from "@heroui/dropdown";
import {Avatar, AvatarGroup, AvatarIcon} from "@heroui/avatar";

// --- Local Imports ---
import { siteConfig } from "@/config/site"; // Your site configuration
import { ThemeSwitch } from "@/components/theme-switch"; // Your theme switch component
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
} from "@/components/icons"; // Your icon components
import { Logo } from "@/components/icons"; // Your logo component
import { useAuth } from '@/contexts/AuthContext'; // Your authentication context

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
            <p className="font-bold text-inherit">RoommateBase</p> {/* Your App Name */}
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
                  as={Link} // Use HeroUI Link for consistent styling
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
                  {/* Map navMenuItems from siteConfig.js (e.g., Profile, Dashboard, Messages, Wishlists) */}
                  {siteConfig.navMenuItems.map((item) => (
                    // Exclude "Logout" if it's explicitly handled separately,
                    // and "Profile" if you prefer a dedicated item above.
                    <DropdownItem key={item.href.replace('/', '')}>{item.label}</DropdownItem>
                  ))}
                  <DropdownItem key="logout" color="danger">
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          ) : (
            // No-login state: Show Login and Sign Up buttons
            <NavbarItem className="hidden md:flex gap-2">
              <Button
                as={Link}
                color="primary"
                href="/login"
                variant="flat"
              >
                Login
              </Button>
              <Button
                as={Link}
                color="primary"
                href="/register"
                variant="solid"
              >
                Sign Up
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
                <NavbarMenuItem>
                  <Link
                    className="w-full"
                    color="foreground"
                    href="/profile" // Link to actual profile page
                    size="lg"
                  >
                    Profile
                  </Link>
                </NavbarMenuItem>
                {siteConfig.navMenuItems.map((item, index) => (
                  // Filter out "Profile" if already handled, handle logout onClick
                  item.href !== "/profile" && (
                    <NavbarMenuItem key={`${item.href}-${index}`}>
                      <Link
                        color={
                          item.href === "/logout"
                            ? "danger"
                            : "foreground"
                        }
                        href="#" // Use # for onClick handling to prevent full page reload
                        size="lg"
                        onClick={() => {
                          if (item.href === "/logout") handleLogout();
                          else navigate(item.href);
                        }}
                      >
                        {item.label}
                      </Link>
                    </NavbarMenuItem>
                  )
                ))}
                {/* Ensure logout is always an option if needed */}
                {!siteConfig.navMenuItems.some(item => item.href === "/logout") && (
                  <NavbarMenuItem>
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
                )}
              </>
            ) : (
              // Mobile menu items for unauthenticated user
              <>
                <NavbarMenuItem>
                  <Link className="w-full" color="primary" href="/login" size="lg">
                    Login
                  </Link>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <Link className="w-full" color="primary" href="/register" size="lg">
                    Sign Up
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