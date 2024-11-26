const express = require('express');
const axios = require('axios');
const router = express.Router();
const { GITHUB_TOKEN } = require('../config');

// GitHub API Base URL
const BASE_URL = 'https://api.github.com';

const githubAxios = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
    },
});

router.get('/profile/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const { data } = await githubAxios.get(`/users/${username}`);
        res.json({
            name: data.name,
            public_repos: data.public_repos,
            followers: data.followers,
            following: data.following,
            avatar_url: data.avatar_url,
            bio: data.bio,
            html_url: data.html_url,
            created_at: data.created_at,
        });
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch profile data' });
    }
});
router.get('/languages/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Fetch all repositories for the user
        const { data: repos } = await githubAxios.get(`/users/${username}/repos`);

        const languageStats = {};

        for (const repo of repos) {
            // Fetch the language breakdown for each repository
            const { data: languages } = await githubAxios.get(repo.languages_url);

            // Accumulate the bytes for each language
            for (const [language, bytes] of Object.entries(languages)) {
                languageStats[language] = (languageStats[language] || 0) + bytes;
            }
        }

        res.json(languageStats);
    } catch (error) {
        console.error('Error fetching language data:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch language data' });
    }
});

router.get('/repos/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Fetch repositories for the user
        const { data: repos } = await githubAxios.get(`/users/${username}/repos`);

        // Map repository data for the frontend
        const repoInsights = repos.map((repo) => ({
            name: repo.name,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            language: repo.language,
            updated_at: repo.updated_at,
            html_url: repo.html_url,
        }));

        // Sort repositories by stars (most popular first)
        repoInsights.sort((a, b) => b.stars - a.stars);

        res.json(repoInsights);
    } catch (error) {
        console.error('Error fetching repositories:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch repositories' });
    }
});

router.get('/recommendations/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Fetch user profile
        const { data: profile } = await githubAxios.get(`/users/${username}`);
        
        // Fetch user repositories
        const { data: repos } = await githubAxios.get(`/users/${username}/repos`);

        const recommendations = [];

        // Check for missing bio
        if (!profile.bio) {
            recommendations.push('Add a bio to your GitHub profile to tell others about yourself.');
        }

        // Check for pinned repositories
        if (repos.length >= 6) {
            recommendations.push('Consider pinning your best repositories for better visibility.');
        }

        // Check for repository topics
        const reposWithoutTopics = repos.filter((repo) => !repo.topics || repo.topics.length === 0);
        if (reposWithoutTopics.length > 0) {
            recommendations.push(
                `Add topics to your repositories (e.g., ${reposWithoutTopics[0].name}) for better discoverability.`
            );
        }

        // Check for profile README
        const readmeRepo = repos.find((repo) => repo.name === `${username.toLowerCase()}`);
        if (!readmeRepo) {
            recommendations.push('Create a profile README to showcase your work.');
        }

        res.json(recommendations);
    } catch (error) {
        console.error('Error generating recommendations:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to generate recommendations' });
    }
});



module.exports = router;
