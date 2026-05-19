---
layout: uesl
title: Logout
permalink: /logout
search_exclude: true
---

<script type="module">
    import { handleLogout } from '{{site.baseurl}}/assets/js/api/logout.js';
    // logout
    await handleLogout();
    // redirect to home
    window.location.href = "{{site.baseurl}}/";
</script>
