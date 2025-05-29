if (!process.env.CLOUDFLARE_API_TOKEN) {
  throw new Error("CLOUDFLARE_API_TOKEN environment variable must be set");
}

if (!process.env.CLOUDFLARE_ZONE_ID) {
  throw new Error("CLOUDFLARE_ZONE_ID environment variable must be set");
}

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = "menuisland.it";

interface CloudflareResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result?: any;
}

export async function createSubdomain(subdomain: string, targetIp: string = "1.1.1.1"): Promise<boolean> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'A',
        name: subdomain,
        content: targetIp,
        ttl: 1, // Automatic TTL
        proxied: true // Enable Cloudflare proxy
      })
    });

    const data: CloudflareResponse = await response.json();
    
    if (!data.success) {
      console.error('Cloudflare API error:', data.errors);
      return false;
    }

    console.log(`Subdomain ${subdomain}.${BASE_DOMAIN} created successfully`);
    return true;
  } catch (error) {
    console.error('Error creating subdomain:', error);
    return false;
  }
}

export async function deleteSubdomain(subdomain: string): Promise<boolean> {
  try {
    // First, find the DNS record
    const listResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${subdomain}.${BASE_DOMAIN}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const listData: CloudflareResponse = await listResponse.json();
    
    if (!listData.success || !listData.result || listData.result.length === 0) {
      console.log(`No DNS record found for ${subdomain}.${BASE_DOMAIN}`);
      return true; // Already doesn't exist
    }

    const recordId = listData.result[0].id;

    // Delete the DNS record
    const deleteResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const deleteData: CloudflareResponse = await deleteResponse.json();
    
    if (!deleteData.success) {
      console.error('Cloudflare delete API error:', deleteData.errors);
      return false;
    }

    console.log(`Subdomain ${subdomain}.${BASE_DOMAIN} deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    return false;
  }
}

export async function checkSubdomainExists(subdomain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${subdomain}.${BASE_DOMAIN}`, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    const data: CloudflareResponse = await response.json();
    
    if (!data.success) {
      console.error('Cloudflare check API error:', data.errors);
      return false;
    }

    return data.result && data.result.length > 0;
  } catch (error) {
    console.error('Error checking subdomain:', error);
    return false;
  }
}

export function generateSubdomain(restaurantName: string): string {
  // Convert restaurant name to a valid subdomain
  return restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

export async function findAvailableSubdomain(baseSubdomain: string): Promise<string> {
  let subdomain = baseSubdomain;
  let counter = 1;

  while (await checkSubdomainExists(subdomain)) {
    subdomain = `${baseSubdomain}-${counter}`;
    counter++;
    
    // Prevent infinite loops
    if (counter > 100) {
      subdomain = `${baseSubdomain}-${Date.now()}`;
      break;
    }
  }

  return subdomain;
}