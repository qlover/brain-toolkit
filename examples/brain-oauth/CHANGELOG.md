# examples/brain-oauth

## 1.2.1

### Patch Changes

#### ✨ Features

- **brain-user:** enhance logging in BrainUserGateway and add type guard for frequent login attempts ([5fd5998](https://github.com/qlover/brain-toolkit/commit/5fd5998de84a96e2c8848471884d2e95b24e0a8c))

- **brain-oauth:** refactor BrainUserOAuthProvider and BrainUserGateway to improve logging and error handling ([ac08ac3](https://github.com/qlover/brain-toolkit/commit/ac08ac3f7cd14ec649a6505f223581fd6ff0df70))

- **brain-oauth:** enhance error handling in OAuth providers and update .gitignore for robots.txt ([ed59877](https://github.com/qlover/brain-toolkit/commit/ed59877b20eeba1425063e3356015ddb14cb2e7e))

- **brain-oauth:** add architecture and demo sections with descriptions for improved documentation ([936eca1](https://github.com/qlover/brain-toolkit/commit/936eca1bc82ea5ca350f4e9d7ec363abaf90dc9f))

- **brain-oauth:** update UserService and AppUserGateway to use GatewayResult for improved error handling and response structure ([4b5d396](https://github.com/qlover/brain-toolkit/commit/4b5d396cfac542e441e75389d848edfd2f9686b0))

- **brain-user:** refactor BrainUserGateway to use GatewayResult type and add error handling; introduce BrainUserIdentifier for consistent error management ([a93bdba](https://github.com/qlover/brain-toolkit/commit/a93bdba5ff73fbeee241d2f03d5b2f760de27254))

- **brain-oauth:** implement phone OTP login functionality with related components and API routes ([97418b6](https://github.com/qlover/brain-toolkit/commit/97418b6fdda2b5a25abcc1de0bcb11473153d621))

- **brain-oauth:** integrate Brain User proxy configuration ([41f519a](https://github.com/qlover/brain-toolkit/commit/41f519a21c43c2844c3b42168c5ad85ce43911ae))
  - Added new environment variables for Brain User proxy base URL and endpoints in the `.env.template`.
  - Updated `ServerConfig` to include parsing for the new proxy settings.
  - Enhanced `BrainUserAdapter` to utilize the proxy configuration for API requests, improving integration with the Brain API.
  - Updated `SeedServerConfigInterface` to define the new properties for proxy configuration.

  These changes enhance the flexibility and configurability of the Brain OAuth application, allowing for better integration with the Brain User service.

- **brain-oauth:** Enhance internationalization identifiers for Brain OAuth ([0e1147e](https://github.com/qlover/brain-toolkit/commit/0e1147e4abd4e19f8662a56529cd12b82bbcdc32))
  - Updated descriptions for various API error identifiers to provide clearer context related to Brain OAuth operations.
  - Improved action labels for admin data-table components, enhancing usability in user management and OAuth audit logs.
  - Refined UI identifiers for common actions and validation messages across the Brain OAuth portal, ensuring consistency and clarity.
  - Enhanced page identifiers and descriptions for various sections, including the about page, developer console, and user registration, to better reflect the Brain OAuth service's purpose and functionality.

  These changes improve the overall user experience and maintainability of the internationalization framework within the Brain OAuth application.

- **brain-oauth:** Update OAuth wrapper and server configuration ([24e8416](https://github.com/qlover/brain-toolkit/commit/24e84168cd3845c4955ec2f1a34f7d51ab5e9f79))
  - Added `@qlover/oauth-wrapper` dependency to enhance OAuth functionality.
  - Updated environment variables in `.env.template` to include CORS settings for allowed origins and methods.
  - Modified server configuration to parse new CORS-related environment variables.
  - Adjusted development and production ports in `package.json` for consistency.
  - Refactored `NextApiServer` to improve request logging and context handling.
  - Introduced a new `BrainUserAdapter` for better integration with the Brain API, encapsulating user authentication and profile retrieval.

  These changes improve the OAuth implementation and enhance server configuration for better security and flexibility.

- **brain-oauth:** Add OAuth integration documentation and routing ([ba17aa8](https://github.com/qlover/brain-toolkit/commit/ba17aa80b46c4b8b2437ef066deb24c9a286000e))
  - Introduced a new OAuth integration documentation page with detailed content on the authorization code flow, endpoints, and PKCE.
  - Updated routing to include a new public documentation route for OAuth.
  - Enhanced internationalization support for the new documentation page, including titles, descriptions, and content in multiple languages.
  - Updated existing components to link to the new OAuth documentation, improving accessibility for developers.

  These changes provide comprehensive guidance for developers integrating with the Brain OAuth system, enhancing the overall developer experience.

- **brain-oauth:** Implement PKCE support for public clients ([e785d8a](https://github.com/qlover/brain-toolkit/commit/e785d8aeae9df2bb0d7b3482eb4b3c7457687630))
  - Added PKCE (Proof Key for Code Exchange) functionality to enhance security for public OAuth clients.
  - Updated OAuth authorization and token services to validate and process PKCE parameters.
  - Introduced new utility functions for PKCE challenge generation and verification.
  - Enhanced test coverage for PKCE scenarios in OAuth services and utilities.
  - Updated database schema to accommodate PKCE-related fields in authorization codes and clients.

  These changes improve the security of the OAuth flow for public clients, ensuring that authorization codes cannot be intercepted and reused without the correct code verifier.

- **brain-oauth:** Refactor error handling and localization in OAuth services ([6be4343](https://github.com/qlover/brain-toolkit/commit/6be43433bc8a812508c1dfcf8e37483d29320e4a))
  - Updated error handling in OAuth services to utilize new localization keys for better clarity and consistency.
  - Enhanced the OAuthTokenError and OAuthUserInfoError classes to include i18n error identifiers.
  - Adjusted API responses in token and userinfo routes to return localized error messages.
  - Removed deprecated components related to developer apps, streamlining the codebase.

  These changes improve the user experience by providing clearer error messages and enhancing the maintainability of the OAuth services.

- **brain-oauth:** Rename dashboard apps route to developer apps ([ec9742e](https://github.com/qlover/brain-toolkit/commit/ec9742e63ad53590d456a62282258317edf9ac76))
  - Updated the route constant from `ROUTE_DASHBOARD_APPS` to `ROUTE_DEVELOPER_APPS` for better clarity.
  - Adjusted related imports and references across routing and UI components to reflect the new naming convention.
  - Ensured consistency in localization for the updated route.

  These changes enhance the clarity of the routing structure, aligning it with the intended functionality of the application.

- **brain-oauth:** Enhance request logging with record type ([af888b1](https://github.com/qlover/brain-toolkit/commit/af888b17a916ec1b6b2918cd73863e795888c543))
  - Added `record_type` column to `request_logs` table for categorizing log entries.
  - Updated `NextApiServer` to include `record_type` in log events.
  - Introduced utility functions to resolve log record types based on request paths.
  - Modified `RequestLogsRepository` and related interfaces to accommodate the new `record_type`.
  - Created new utility functions for logging OAuth-related requests.

  These changes improve the granularity of request logging, allowing for better tracking and analysis of OAuth-related traffic.

- **brain-oauth:** Enhance OAuth playground and developer UI components ([10e13f7](https://github.com/qlover/brain-toolkit/commit/10e13f7693de02809c9c90b039d4a66d0504807a))
  - Added a requestId getter in BootstrapServer for tracking server invocations.
  - Introduced a new simulated callback footer note in the OAuth playground for better user guidance.
  - Updated DeveloperAppsPage and related components to include improved UI styles and functionality.
  - Implemented DeveloperConfirmDialog and DeveloperOverlayModal for better user interactions during app management.
  - Refactored various components to utilize shared styles for consistency across the OAuth developer interface.

  These changes improve the usability and visual consistency of the OAuth playground and developer management features, enhancing the overall developer experience.

- **brain-oauth:** Introduce OAuth playground feature with validation and testing utilities ([b6b787b](https://github.com/qlover/brain-toolkit/commit/b6b787ba03b66783883228db039603d24091dde7))
  - Added a new OAuth playground page for in-app testing of OAuth flows, including authorization and token exchange.
  - Implemented utility functions for building authorization URLs and parsing OAuth callback responses.
  - Created API route for validating OAuth parameters against registered clients.
  - Developed comprehensive tests for the OAuth playground utilities to ensure functionality and reliability.
  - Enhanced localization support for the OAuth playground interface, including titles, descriptions, and user instructions.

  This commit significantly improves the developer experience by providing a dedicated environment for testing OAuth flows and validating parameters, ensuring a smoother integration process for developers.

- **brain-oauth:** Add testing framework and implement OAuth token and userinfo service tests ([11a8cbb](https://github.com/qlover/brain-toolkit/commit/11a8cbb840efbc63e5cf679d54867e0f8a4aab81))
  - Introduced Vitest as the testing framework for the project.
  - Added tests for the OAuth token exchange functionality, covering various scenarios including successful exchanges and error handling.
  - Implemented tests for the userinfo endpoint, validating the retrieval of user claims and error responses.
  - Created utility tests for parsing Bearer tokens and OAuth token requests to ensure proper functionality.

  This commit enhances the test coverage for the OAuth implementation, ensuring reliability and correctness in the authentication flow.

- **brain-oauth:** Implement userinfo endpoint for OAuth 2.0 ([60525b4](https://github.com/qlover/brain-toolkit/commit/60525b4093693836017adb32bf75a0906d4c4b5f))
  - Added OAuthUserInfoController to handle userinfo requests at the `/userinfo` endpoint.
  - Introduced OAuthUserInfoService to validate Bearer access tokens and retrieve user profiles.
  - Implemented error handling for invalid tokens using OAuthUserInfoError.
  - Created utility functions for parsing Bearer tokens and formatting error responses.
  - Updated routing configuration to include the new userinfo endpoint.

  This commit enhances the OAuth 2.0 implementation by providing a standardized way to access user profile information for authenticated clients.

- **brain-oauth:** Enhance developer console with new features and localization support ([72c25e2](https://github.com/qlover/brain-toolkit/commit/72c25e221088ca158d763ea491562b7d2e27037a))
  - Updated OAuthClientsController to resolve the authenticated user's ID directly from the user session.
  - Added new localization keys for the developer console, including subtitles and modal titles for client credentials.
  - Introduced a new CopyableCredential component for displaying and copying client credentials.
  - Enhanced the DeveloperAppsPage with loading states and improved error handling for API calls.
  - Created OAuthClientCredentialsModal for displaying client credentials with copy functionality.
  - Refactored routing components to support the new AppRoutePage structure, improving modularity and maintainability.

  This commit significantly improves the developer experience by adding essential features and enhancing localization support in the Brain OAuth application.

- **brain-oauth:** Implement OAuth client management features ([cab1af5](https://github.com/qlover/brain-toolkit/commit/cab1af5d19fbcd499584d31d4a0c7120e95bb0e6))
  - Added a new developer console for managing OAuth clients, including listing, creating, updating, and deleting clients.
  - Developed the OAuthClientsController to handle API requests related to OAuth clients.
  - Introduced OAuthClientsService for business logic and interaction with the OAuthClientsRepository.
  - Created API routes for client operations, including endpoints for listing clients, creating new clients, and managing client secrets.
  - Implemented localization support for the developer console interface in both Chinese and English.
  - Enhanced the UI with responsive design and dark/light theme support.

  This commit establishes a comprehensive management system for OAuth clients, improving developer experience and functionality in the Brain OAuth application.

- **brain-oauth:** Implement OAuth token exchange functionality ([6e55c44](https://github.com/qlover/brain-toolkit/commit/6e55c445e53aed78f1a8a4b6814b72b7f5303a1a))
  - Added OAuthTokenController to handle token exchange requests at the `/oauth/token` endpoint.
  - Developed OAuthTokenService for processing authorization codes and refresh tokens, including validation and error handling.
  - Introduced OAuthRefreshTokensRepository for managing refresh tokens, including creation and revocation.
  - Implemented utility functions for hashing client secrets and parsing OAuth token requests.
  - Enhanced routing configuration to support the new token endpoint and middleware for OAuth machine routes.

  This commit establishes a critical component of the OAuth 2.0 flow, enabling secure token exchanges for client applications.

- **brain-oauth:** Implement OAuth authorization flow with consent handling ([c55bc12](https://github.com/qlover/brain-toolkit/commit/c55bc124c8616941f0ef443f6c0bc384ce1bc76a)) ([#47](https://github.com/qlover/brain-toolkit/pull/47))
  - Added OAuth authorization page prototype in HTML, featuring a responsive design and localization support for Chinese and English.
  - Implemented OAuthConsentController and OAuthConsentService to handle user consent submissions.
  - Created repositories for managing OAuth authorization codes and clients, ensuring secure storage and retrieval.
  - Developed utility functions for building OAuth redirect URLs and parsing scope lists.
  - Integrated validation for OAuth query parameters and consent body using Zod schemas.
  - Enhanced routing and i18n mapping to support the new OAuth consent flow.

  This commit establishes a foundational structure for the OAuth 2.0 authorization process, improving user experience and security in the Brain OAuth application.

- **brain-oauth:** Implement home page prototype with localization and enhanced UI components ([f68d4ec](https://github.com/qlover/brain-toolkit/commit/f68d4ecafa1f1dd7bffcc4a196bb9db34ead148e)) ([#46](https://github.com/qlover/brain-toolkit/pull/46))
  - Added a new home page prototype in HTML format, featuring a responsive design and dark/light theme support.
  - Introduced localization for the home page, including titles, descriptions, and navigation elements in both Chinese and English.
  - Created new UI components for the home page, including a header navigation, hero section, features display, and call-to-action sections.
  - Updated routing and i18n mapping to support the new home page structure and navigation links.
  - Refactored existing components to improve modularity and maintainability, including the addition of shared header styles.

  This commit establishes a foundational layout for the Brain OAuth application, enhancing user experience and accessibility.

- **brain-oauth:** implement OAuth middleware with Brain API integration ([d1c0de0](https://github.com/qlover/brain-toolkit/commit/d1c0de0129a3e3dab07eb8c870669e070c7a3852)) ([#45](https://github.com/qlover/brain-toolkit/pull/45))
  - Added BrainUserAdapter for handling OAuth token and user info flows.
  - Created BrainAuthController for managing user login and session management.
  - Introduced OAuthCredentialsRepository for storing and retrieving user credentials and refresh tokens.
  - Implemented BrainSessionService for managing session cookies and user authentication state.
  - Developed utility functions for token extraction and encryption.
  - Updated SQL schema to support new Brain OAuth tables and relationships.
  - Refactored API routes to include a new login endpoint for Brain OAuth verification.

  This commit establishes a comprehensive OAuth middleware setup, enhancing user authentication and session management capabilities.

- **brain-oauth:** refactor BrainAuthController and implement BrainAuthService for login handling ([0fddcd4](https://github.com/qlover/brain-toolkit/commit/0fddcd419e14892f37b66548e41770b0322922fc)) ([#45](https://github.com/qlover/brain-toolkit/pull/45))
  - Refactored BrainAuthController to utilize LoginValidator and BrainAuthService for login verification.
  - Introduced BrainAuthService to orchestrate login processes, including token exchange and user session management.
  - Created BrainAuthServiceInterface to define the structure for login verification.
  - Updated API route to streamline login request handling.
  - Removed deprecated code related to direct user credential handling in the controller.

  This commit enhances the separation of concerns in the authentication flow, improving maintainability and clarity.

- **brain-oauth:** enhance Brain OAuth documentation and refactor session management ([a45e65a](https://github.com/qlover/brain-toolkit/commit/a45e65affde0205fafd32c81969d945c783d2763)) ([#45](https://github.com/qlover/brain-toolkit/pull/45))
  - Updated the product requirements and technical design documentation to reflect the latest versioning and architectural changes.
  - Refactored UserController to streamline login handling by removing direct server authentication dependencies.
  - Introduced BrainSessionService for improved session management, including cookie handling and user session verification.
  - Updated ServerAuth to utilize BrainSessionService, ensuring a single source of truth for user authentication state.
  - Added utility functions for parsing and managing Brain session cookies, enhancing code clarity and maintainability.

  This commit improves the overall structure and documentation of the Brain OAuth implementation, facilitating better understanding and usage for developers.

- **brain-oauth:** add new example project with OAuth integration ([c4b6e46](https://github.com/qlover/brain-toolkit/commit/c4b6e4627d56ed629acf8fde95379ee9d68004ea))
  - Introduced a new example project for brain-oauth, featuring a complete setup with Next.js, TypeScript, and various configurations.
  - Added scripts for development and production environments in package.json.
  - Created essential files including .env.template, .gitignore, and ESLint configuration.
  - Implemented localization support with next-intl and structured the project for clear layering between server and client code.
  - Included README documentation in both English and Chinese to guide users through setup and usage.

  Co-authored-by: QRJ <github-actions[bot]@users.noreply.github.com>

#### 🐞 Bug Fixes

- **brain-oauth:** update default session key and correct footer text in OAuthPlayground ([6eeaa34](https://github.com/qlover/brain-toolkit/commit/6eeaa34f2d396d9cd3732839656e046462f029a2))

- **home-architecture:** wrap icons in span for consistent styling ([c1d3fb2](https://github.com/qlover/brain-toolkit/commit/c1d3fb26a78ed4f391f85be0011ed26c3ea67964))

- **brain-oauth:** Introduce PagesBridge component for enhanced routing ([89d3539](https://github.com/qlover/brain-toolkit/commit/89d3539591f9e4610e5d322d2a2de85e2ee6fcd8))
  - Added a new `PagesBridge` component to facilitate routing with locale support in the application.
  - Integrated `PagesBridge` into `AppRoutePagePages` to manage navigation based on the current locale.
  - Updated `RoutePageLayout` documentation to reflect the inclusion of `PagesBridge` in the top slot rendering.

  These changes improve the routing capabilities and internationalization support within the Brain OAuth application.

#### ♻️ Refactors

- **brain-oauth:** Merge code from next-oauth-wrapper ([a5841b4](https://github.com/qlover/brain-toolkit/commit/a5841b423f8bec5ae720e3a088a430a201d0539a))

- **brain-user:** remove example project files and clean up unused components ([761afa5](https://github.com/qlover/brain-toolkit/commit/761afa540e721b3cac6dc79eca2ddd16d51d0fba))
  - Deleted the entire `brain-user` example project, including all related files such as components, utilities, and configuration files.
  - Removed obsolete `.gitignore`, `README.md`, and `CHANGELOG.md` to streamline the repository.
  - This cleanup enhances the overall project structure and reduces clutter in the codebase.

- **brain-oauth:** Introduce header navigation components and update routing ([a6fd341](https://github.com/qlover/brain-toolkit/commit/a6fd3417e31b0e1e13e6512f7ff1b54aa8b490b6))
  - Added new `AppHeaderNav` and `AppHeaderNavPages` components for improved header navigation in the application.
  - Replaced the deprecated `HomeHeaderNav` with the new `AppHeaderNav` to streamline navigation across different pages.
  - Updated the `RoutePageLayout` and related components to conditionally render the header navigation based on the `showHeaderNav` prop.
  - Enhanced internationalization support for the new header navigation links, improving accessibility and user experience.

  These changes enhance the overall structure and usability of the application's header navigation.

- **brain-oauth:** Remove obsolete OAuth test files and update server structure ([82808fb](https://github.com/qlover/brain-toolkit/commit/82808fb197af55481790e848c8fbf7bba99d9700))
  - Deleted outdated test files for OAuth services and routes to streamline the testing environment.
  - Refactored the `NextApiServer` class to enhance context handling and logging capabilities.
  - Updated the `OAuthWrapperController` to utilize a new token encryption mechanism, improving security.
  - Introduced a new utility for mapping OAuth errors to internationalization keys, enhancing error handling consistency.

  These changes simplify the codebase and improve the maintainability of the OAuth implementation.

- **brain-oauth:** Update import paths and service structure for OAuth tests ([8f3aacc](https://github.com/qlover/brain-toolkit/commit/8f3aacc315f5045e5877e14a4a8efdae50c696ec))
  - Refactored import statements in test files to utilize the shared OAuth wrapper, enhancing code organization.
  - Updated service implementations to replace `OAuthAuthorizeService` and `OAuthUserInfoService` with `OAuthWrapperService`, improving consistency across the codebase.
  - Adjusted test cases for `OAuthTokenService` and related services to align with the new structure, ensuring maintainability and clarity.

  These changes streamline the OAuth testing environment and prepare the codebase for future enhancements.

- **brain-oauth:** Update import paths and clean up code structure ([4ab6f6d](https://github.com/qlover/brain-toolkit/commit/4ab6f6d7a077c0fea5376ccd89ee521ba17ee287))
  - Refactored import statements in various test files and service implementations to use updated paths from the shared OAuth wrapper.
  - Removed deprecated `BrainAuthController` and related interfaces, streamlining the codebase.
  - Introduced new `BrainOAuthRepository` to centralize OAuth client and token management, enhancing maintainability.
  - Added new utility functions for session management and improved session handling in the `BrainSessionService`.

  These changes improve code organization and prepare the codebase for future enhancements in the OAuth implementation.

- **brain-oauth:** Update OAuth user adapter implementation and tests ([8f2f0da](https://github.com/qlover/brain-toolkit/commit/8f2f0daf3aca356c67fb6525bf22d62a82df621c))
  - Replaced instances of `BrainUserAdapter` with `OAuthUserAdapterInterface` across services and tests to standardize the user adapter interface.
  - Updated test files for `OAuthTokenService` and `OAuthUserInfoService` to reflect the new adapter interface, enhancing maintainability and clarity.
  - Introduced a new `BrainUserAdapter` implementation to encapsulate Brain API interactions, improving separation of concerns.
  - Added a new `OAuthUserAdapterInterface` to define a consistent contract for user adapters, facilitating easier integration with different user systems.

  These changes streamline the OAuth implementation, making it more adaptable to future user provider integrations.

- **brain-oauth:** Clean up import statements and formatting in test files ([ba33874](https://github.com/qlover/brain-toolkit/commit/ba338749a65a7851cfc1b8632b6d6079f6494a6b))
  - Reformatted import statements for consistency across various test files.
  - Improved code readability by adjusting line breaks and indentation in test cases.
  - Enhanced maintainability of the codebase by streamlining the structure of test files.

  These changes contribute to a cleaner and more organized testing environment, making it easier for developers to navigate and understand the tests.

- **brain-oauth:** Improve code readability and organization ([ec146bd](https://github.com/qlover/brain-toolkit/commit/ec146bd7f9f16752dbf527d76f089e6406776623))
  - Reformatted import statements for better clarity and consistency across test files and services.
  - Enhanced method signatures with clearer parameter formatting in various service classes.
  - Streamlined code structure in utility functions and repository methods for improved maintainability.
  - Updated localization keys for better alignment with coding standards.

  These changes enhance the overall readability and maintainability of the codebase, making it easier for developers to navigate and understand the project structure.

- **brain-oauth:** Simplify client ID handling in API routes ([0610fcf](https://github.com/qlover/brain-toolkit/commit/0610fcf6181e7f129ab2b060bb93d81114ebb33d))
  - Updated API route handlers for GET, PUT, and DELETE methods to use a unified ClientIdRouteContext type for better readability and maintainability.
  - Replaced direct parameter access with destructured clientId from the context in the respective methods.
  - Enhanced the DELETE method to return a 400 status for unsuccessful operations, improving error handling.
  - Updated the DeveloperAppsPage to encode the clientId in the DELETE request, ensuring proper URL formatting.

  These changes streamline the code and improve the robustness of client management operations in the Brain OAuth application.
