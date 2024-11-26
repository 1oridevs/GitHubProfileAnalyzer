const express = require('express');
const axios = require('axios');
const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const githubAxios = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
    },
});

// Fetch user profile
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
        console.error('Error fetching profile:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch profile data' });
    }
});

// Fetch language data
router.get('/languages/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const { data: repos } = await githubAxios.get(`/users/${username}/repos`);
        const languageStats = {};

        for (const repo of repos) {
            const { data: languages } = await githubAxios.get(repo.languages_url);
            for (const [language, bytes] of Object.entries(languages)) {
                languageStats[language] = (languageStats[language] || 0) + bytes;
            }
        }

        res.json(languageStats);
    } catch (error) {
        console.error('Error fetching languages:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch language data' });
    }
});

// Fetch repositories
router.get('/repos/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const { data: repos } = await githubAxios.get(`/users/${username}/repos`);

        const repoData = repos.map((repo) => ({
            name: repo.name,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            watchers: repo.watchers_count,
            language: repo.language,
            updated_at: repo.updated_at,
            html_url: repo.html_url,
        }));

        repoData.sort((a, b) => b.stars - a.stars);
        res.json(repoData);
    } catch (error) {
        console.error('Error fetching repositories:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch repositories' });
    }
});

// Generate recommendations
router.get('/recommendations/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const { data: profile } = await githubAxios.get(`/users/${username}`);
        const { data: repos } = await githubAxios.get(`/users/${username}/repos`);

        const recommendations = [];

        if (!profile.bio) {
            recommendations.push('Add a bio to your GitHub profile to tell others about yourself.');
        }

        if (repos.length >= 6) {
            recommendations.push('Consider pinning your best repositories for better visibility.');
        }

        const reposWithoutTopics = repos.filter((repo) => !repo.topics || repo.topics.length === 0);
        if (reposWithoutTopics.length > 0) {
            recommendations.push(
                `Add topics to your repositories (e.g., ${reposWithoutTopics[0].name}) for better discoverability.`
            );
        }

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
