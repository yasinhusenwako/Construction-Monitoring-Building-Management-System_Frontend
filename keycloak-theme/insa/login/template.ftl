<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body class="${properties.kcBodyClass!}">
<div class="insa-login-container">
    
    <!-- LEFT SIDE: Branding Sidebar -->
    <div class="insa-branding-sidebar">
        <div class="branding-content">
            <!-- Logo Section -->
            <div class="logo-section">
                <div class="logo-box">
                    <img src="${url.resourcesPath}/img/logo.png" alt="INSA Logo" />
                </div>
                <div class="logo-text">
                    <h2 class="logo-title">INSA CSBMS</h2>
                    <p class="logo-subtitle">ENTERPRISE SOLUTION</p>
                </div>
            </div>

            <!-- Value Prop Section -->
            <div class="value-prop">
                <h1 class="main-heading">
                    Construction Supervision & <br />
                    <span class="highlight">Building Management</span>
                </h1>
                <p class="main-description">
                    Centralized platform for comprehensive project oversight, intelligent resource allocation, and streamlined maintenance operations.
                </p>
            </div>

            <!-- Feature Cards -->
            <div class="feature-cards">
                <div class="feature-card">
                    <div class="feature-icon feature-icon-blue">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h4>Project Oversight</h4>
                        <p>Real-time stage-by-stage monitoring.</p>
                    </div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon feature-icon-orange">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div class="feature-text">
                        <h4>Space Strategy</h4>
                        <p>Intelligent resource & booking control.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- RIGHT SIDE: Form Section -->
    <div class="insa-form-section">
        <!-- Top Navigation -->
        <div class="top-nav">
            <div class="mobile-logo">
                <div class="mobile-logo-box">
                    <img src="${url.resourcesPath}/img/logo.png" alt="INSA Logo" />
                </div>
                <span class="mobile-logo-text">INSA CSBMS</span>
            </div>
            <div class="top-nav-right">
                <div class="status-badge">
                    <div class="status-dot"></div>
                    <span>SYSTEM OPERATIONAL</span>
                </div>
            </div>
            <div class="switchers">
                <!-- Theme Switcher -->
                <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">
                    <svg class="sun-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    <svg class="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Form Container -->
        <div class="form-container">
            <div class="form-wrapper">
                <div class="form-header">
                    <h2 class="form-title">Welcome Back</h2>
                    <p class="form-subtitle">Sign in with your Keycloak account to continue</p>
                </div>

                <div class="form-card">
                    <#-- App-initiated actions should not see warning messages about the need to complete the action -->
                    <#-- during login.                                                                               -->
                    <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                        <div class="alert alert-${message.type}">
                            <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                            <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                            <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                            <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                            <span class="kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
                        </div>
                    </#if>

                    <#nested "form">

                    <#if displayInfo>
                        <div id="kc-info" class="${properties.kcSignUpClass!}">
                            <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                                <#nested "info">
                            </div>
                        </div>
                    </#if>
                </div>

                <div class="form-footer">
                    <p>Need help? Contact your system administrator</p>
                </div>
            </div>
        </div>
    </div>

</div>
<script>
// Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Initialize on page load
(function() {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
})();
</script>
</body>
</html>
</#macro>
