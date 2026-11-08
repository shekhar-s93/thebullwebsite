# TheBull Resource Hub

# TheBull — Complete Website Development 
Build a complete, modern, responsive website named **TheBull** from scratch.

TheBull is a curated platform for discovering videos, websites, and applications. Users can browse resources, while the administrator manages all content through a secure admin dashboard.

This must be a fully functional application with a database, authentication, and persistent storage—not just a static UI.

Use the following requirements carefully.

---

# 1. Technology Stack

Use:
- React
- TypeScript
- Tailwind CSS
- Lovable-supported modern framework
- Supabase for database, authentication, and file storage
- GitHub integration
- Vercel-compatible deployment

Use reusable components and a clean project structure.

---

# 2. Branding and Design

Website name: TheBull

Create a modern, premium, professional dark-themed website.

Design:
- Dark background
- Charcoal cards
- White primary text
- Gray secondary text
- Attractive accent color
- Modern typography
- Smooth hover effects
- Rounded cards
- Responsive layout
- Professional spacing

I will provide my official TheBull logo.

**Use the exact logo I provide. Do not redesign, recreate, or replace it with another logo.**

Ensure the logo:
- Maintains its original aspect ratio
- Displays correctly in the navbar
- Displays correctly in the footer
- Displays correctly on the admin dashboard
- Works on desktop and mobile

---

# 3. Website Navigation

Create a responsive navbar containing:
- TheBull Logo
- Home
- Videos
- Sites
- Applications
- Search
- Admin Login

Requirements:
- Active page indicator
- Mobile hamburger menu
- Responsive layout
- Logo redirects to homepage

---

# 4. Homepage

Create a premium homepage with:

## Hero Section
- TheBull logo
- Heading: "Discover Videos, Websites & Applications"
- Description
- Search bar
- Browse Videos button
- Explore Sites button
- Explore Applications button

## Homepage Sections
- Featured Videos
- Featured Sites
- Featured Applications
- Recently Added Resources
- Popular Categories

## Footer
- TheBull logo
- Website description
- Navigation links
- Privacy Policy
- Terms of Service
- Copyright

---

# 5. Videos Page

Create a Videos directory where users can:
- Browse published videos
- Search videos
- Filter by category
- Filter by platform
- Sort by newest
- View featured videos
- View recently added videos
- Use pagination or Load More

## Video Card

Each card should display:
- Image/thumbnail
- Video title
- Description
- Category
- Platform name
- Featured badge
- View Video button

Clicking a video should redirect users to its original video URL.

Do not embed videos by default.

Allow video links from any platform, including:
- YouTube
- Vimeo
- Instagram
- Facebook
- TikTok
- Dailymotion
- Twitch
- Other video platforms
- Custom video URLs

Do not restrict video URLs to a fixed list of domains.

---

# 6. Sites Page

Create a Sites directory.

Features:
- Browse published websites
- Search by name
- Filter by category
- Featured websites
- Recently added websites
- Newest sorting
- Pagination or Load More

## Site Card

Display:
- Website logo/image
- Website name
- Description
- Category
- Featured badge
- Visit Website button

Open the original website URL when clicked.

---

# 7. Applications Page

Create an Applications directory.

Features:
- Browse published applications
- Search applications
- Filter by category
- Filter by platform
- Featured applications
- Recently added applications
- Newest sorting
- Pagination or Load More

## Application Card

Display:
- Application icon/image
- Application name
- Description
- Category
- Supported platform
- Featured badge
- Get Application button

Supported platforms:
- Windows
- macOS
- Linux
- Android
- iOS
- Web
- Cross-platform

---

# 8. Universal Image System — IMPORTANT

I want to use **any type of image**, not just images specifically designed as thumbnails.

Images may be:
- JPG
- JPEG
- PNG
- WebP
- GIF
- SVG where safe and supported

Apply this image system to:
- Videos
- Sites
- Applications

The admin must have two image options.

## Option 1: Google Drive Image URL

Add a field named:

**Google Drive / Image URL**

I want to paste image links from my Google Drive.

Requirements:
- Accept Google Drive sharing links.
- Extract the Google Drive file ID when possible.
- Convert supported Google Drive sharing links into a usable image URL.
- Automatically display the image preview.
- Load the image on the website after saving.
- Support common Google Drive link formats.
- Allow editing and removing the URL.
- Save the original link and/or resolved image URL as needed.

Example input:
https://drive.google.com/file/d/FILE_ID/view?usp=sharing

The website should attempt to display the image using the appropriate Google Drive image-serving URL.

Important:
- The Google Drive file must be accessible to the website.
- Explain that Google Drive sharing permissions may need to be set to "Anyone with the link".
- Handle unsupported or inaccessible images gracefully.
- Do not assume every Google Drive link is a direct image URL.

## Option 2: Upload Image From Local PC

Add a button named:

**Upload Image From Computer**

Requirements:
- Allow selecting images from my local PC.
- Support JPG, JPEG, PNG, WebP, and GIF.
- Display image preview before saving.
- Allow replacing the image.
- Allow removing the image.
- Support image uploads for Videos, Sites, and Applications.
- Save uploaded images in Supabase Storage or the project's existing persistent storage.
- Store the uploaded image URL or storage path in the database.
- Do not store raw image files inside database records.
- Uploaded images must remain available after refreshing the website.
- Public website visitors must be able to see the images.

## Image Source Selector

In every Video, Site, and Application Add/Edit form, provide:

- Google Drive / External Image URL
- Upload Image From Computer

Allow the admin to switch between the two options.

When one option is selected, use that source for the resource image.

Show a live preview.

Allow resources to be saved without an image.

If an image fails to load, show a fallback placeholder.

Do not limit images based on whether they are called thumbnails, logos, icons, or cover images. Any supported image should be usable.

---

# 9. Change Website Logo From Admin Panel

Add a **Website Branding** section inside the admin dashboard.

The administrator must be able to:

- Change the website logo
- Upload a new logo from local PC
- Optionally provide a Google Drive or external image URL for the logo
- Preview the logo before saving
- Replace the existing logo
- Remove the logo if necessary
- Save changes
- Restore the default logo if desired

The logo must update automatically throughout the entire website:
- Navbar
- Footer
- Admin dashboard
- Login page
- Website branding areas

Do not hardcode the logo in individual components.

Use a centralized branding setting stored in the database.

The logo should maintain its original aspect ratio and should not be stretched.

I will provide the initial official TheBull logo.

---

# 10. Dynamic Category Management

Create a **Manage Categories** section in the admin panel.

Categories must be completely manageable by the administrator.

The admin must be able to:
- Add new categories
- Edit category names
- Delete categories
- Change category descriptions
- Change category icons or images where applicable
- Enable or disable categories
- Assign categories to Videos
- Assign categories to Sites
- Assign categories to Applications

Do not hardcode categories in frontend code.

Create a database-backed category system.

Each category should include:
- Category ID
- Category name
- Description
- Resource type
- Optional icon/image
- Active status
- Created date

Allow categories to be used for:
- Videos
- Sites
- Applications

Categories should update automatically across:
- Admin forms
- Public filters
- Homepage category sections
- Resource cards

If a category is deleted, handle existing resources safely. Do not accidentally delete associated Videos, Sites, or Applications.

Use confirmation before deleting a category.

---

# 11. Dynamic Video Platform Management

Create a **Manage Video Platforms** section in the admin panel.

I want to add new video platforms whenever I want.

Do not hardcode the platform list.

Initial platforms:
- YouTube
- Vimeo
- Instagram
- Facebook
- TikTok
- Dailymotion
- Twitch
- Other
- Custom Video URL

Admin features:
- Add platform
- Edit platform name
- Delete platform
- Enable or disable platform
- Add platform icon or logo using image URL
- Select platform while adding or editing videos

Each platform should have:
- Platform ID
- Platform name
- Optional platform logo/icon
- Active status
- Created date

The admin should be able to add platforms such as:
- New video websites
- Custom streaming platforms
- Other social video platforms

Do not restrict video URL input based on selected platform.

The platform selection is for organization and filtering only.

Allow any valid HTTP or HTTPS video URL.

If the admin selects "Other" or "Custom Video URL", allow entering a custom platform name if necessary.

---

# 12. Admin Dashboard

Create a secure admin panel.

Dashboard statistics:
- Total Videos
- Total Sites
- Total Applications
- Published Resources
- Draft Resources
- Featured Resources
- Total Categories
- Total Video Platforms

Admin navigation:
- Dashboard
- Manage Videos
- Manage Sites
- Manage Applications
- Manage Categories
- Manage Video Platforms
- Website Branding
- Settings
- Logout

---

# 13. Manage Videos

Admin must be able to:
- Add videos
- Edit videos
- Delete videos
- Publish/unpublish videos
- Feature/unfeature videos
- Search videos
- Filter videos
- Change video category
- Change video platform

Video form:
- Video Title
- Video URL
- Video Platform
- Description
- Category
- Image Source
- Google Drive / External Image URL
- Upload Image From Computer
- Featured toggle
- Published toggle

Allow any valid HTTP or HTTPS video URL.

Do not restrict video platforms.

---

# 14. Manage Sites

Admin must be able to:
- Add sites
- Edit sites
- Delete sites
- Publish/unpublish sites
- Feature/unfeature sites
- Search sites
- Filter sites
- Change site category

Site form:
- Website Name
- Website URL
- Description
- Category
- Image Source
- Google Drive / External Image URL
- Upload Image From Computer
- Featured toggle
- Published toggle

---

# 15. Manage Applications

Admin must be able to:
- Add applications
- Edit applications
- Delete applications
- Publish/unpublish applications
- Feature/unfeature applications
- Search applications
- Filter applications
- Change category
- Change supported platform

Application form:
- Application Name
- Application URL
- Description
- Category
- Supported Platform
- Image Source
- Google Drive / External Image URL
- Upload Image From Computer
- Featured toggle
- Published toggle

---

# 16. Authentication and Security

Implement secure admin authentication.

Requirements:
- Admin login
- Logout
- Protected admin pages
- Only administrators can manage resources
- Public visitors can browse published resources
- No public admin registration
- Secure database policies
- Secure file storage permissions
- Validate user input and URLs

Do not expose Supabase secret keys in frontend code.

Do not hardcode admin passwords.

Explain how I can create the first administrator account.

---

# 17. Database and Storage

Use Supabase for:
- Database
- Authentication
- Persistent image storage

Create database tables for:
- Videos
- Sites
- Applications
- Categories
- Video Platforms
- Website Settings / Branding
- Admin roles if needed

Use proper relationships and IDs.

All admin changes must persist after refreshing the website.

Ensure published resources appear publicly and unpublished resources remain private.

Use Supabase Storage for uploaded images.

Do not create separate storage providers unnecessarily.

---

# 18. Search, Filtering, and Sorting

Implement search and filters for all resource pages.

Search:
- Name/title
- Description
- Category

Filters:
- Category
- Video platform
- Application platform
- Featured resources

Sorting:
- Newest
- Oldest
- Featured

Include:
- Clear filters
- Loading indicators
- Empty state
- Error state

---

# 19. Responsive Design

Ensure the entire website works on:
- Desktop
- Laptop
- Tablet
- Mobile

Requirements:
- Responsive navbar
- Responsive resource grids
- Mobile-friendly admin panel
- Responsive image previews
- Proper spacing
- No horizontal overflow

---

# 20. SEO and Performance

Implement:
- Page titles
- Meta descriptions
- Open Graph metadata
- Clean URLs
- Lazy-loaded images
- Efficient database queries
- Loading states
- Error states

---

# 21. Deployment

Make the project compatible with:
- GitHub
- Vercel
- Supabase

Use environment variables for configuration.

Provide instructions for:
- Supabase setup
- Creating the admin account
- Connecting GitHub
- Deploying to Vercel

---

# 22. Final Requirements

This must be a fully working application.

Do not create only a visual prototype.

All buttons and forms must work.

The following must be functional:
- Videos
- Sites
- Applications
- Admin authentication
- Add/edit/delete resources
- Publish/unpublish
- Featured resources
- Google Drive image links
- External image links
- Local PC image uploads
- Dynamic website logo
- Dynamic categories
- Dynamic video platforms
- Search
- Filtering
- Sorting
- Video redirection
- Website links
- Application links

Use the exact TheBull logo I provide.

Do not restrict video platforms.

Do not restrict image usage to conventional thumbnails.

Build the complete application using a clean, maintainable architecture.

Before finishing, test the important features and explain any external configuration I need to complete.

Start building the complete TheBull website now.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0e766fab-9e36-4c07-8095-0a55058bac8e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
