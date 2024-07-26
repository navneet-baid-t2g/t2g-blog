import axios from 'axios';

export default async function handler(req, res) {
    try {
        // Replace 'your-instagram-api-endpoint' with the actual API endpoint
        const response = await axios.get('https://api.instagram.com/v1/users/self/media/recent/?access_token=YOUR_ACCESS_TOKEN');
        
        // Extract and format the necessary data
        const posts = response.data.data.map(post => ({
            id: post.id,
            imageUrl: post.images.standard_resolution.url,
            link: post.link
        }));
        
        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Instagram data', error: error.message });
    }
}
