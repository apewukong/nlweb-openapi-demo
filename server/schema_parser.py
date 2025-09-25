import json
import logging
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

class SchemaOrgParser:
    def __init__(self):
        self.supported_types = {
            'Restaurant', 'Hotel', 'Event', 'Organization', 
            'Product', 'Service', 'Place', 'Person', 'Article'
        }
        
    async def parse_url(self, url: str) -> List[Dict[str, Any]]:
        """Parse Schema.org data from a single URL"""
        try:
            logger.info(f"Parsing Schema.org data from: {url}")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            schema_objects = []
            
            # Parse JSON-LD
            json_ld_scripts = soup.find_all('script', {'type': 'application/ld+json'})
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    schema_objects.extend(self._extract_schema_objects(data))
                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON-LD in {url}: {str(e)}")
            
            # Parse microdata (basic implementation)
            microdata_objects = self._parse_microdata(soup)
            schema_objects.extend(microdata_objects)
            
            # Parse RDFa (basic implementation)
            rdfa_objects = self._parse_rdfa(soup)
            schema_objects.extend(rdfa_objects)
            
            # Filter and clean objects
            filtered_objects = [
                obj for obj in schema_objects 
                if obj.get('@type') in self.supported_types
            ]
            
            logger.info(f"Found {len(filtered_objects)} Schema.org objects in {url}")
            return filtered_objects
            
        except Exception as e:
            logger.error(f"Error parsing {url}: {str(e)}")
            return []
    
    async def parse_sitemap(self, sitemap_url: str) -> List[Dict[str, Any]]:
        """Parse Schema.org data from all URLs in a sitemap"""
        try:
            logger.info(f"Processing sitemap: {sitemap_url}")
            
            response = requests.get(sitemap_url, timeout=30)
            response.raise_for_status()
            
            # Parse sitemap XML
            root = ET.fromstring(response.content)
            
            # Handle different sitemap formats
            urls = []
            namespaces = {'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            
            # Standard sitemap
            for url_elem in root.findall('.//sitemap:url/sitemap:loc', namespaces):
                urls.append(url_elem.text)
            
            # Sitemap index
            for sitemap_elem in root.findall('.//sitemap:sitemap/sitemap:loc', namespaces):
                if sitemap_elem.text:
                    urls.extend(await self._get_sitemap_urls(sitemap_elem.text))
            
            logger.info(f"Found {len(urls)} URLs in sitemap")
            
            # Parse schema from each URL (limit for demo)
            all_objects = []
            for url in urls[:50]:  # Limit to first 50 URLs for demo
                objects = await self.parse_url(url)
                all_objects.extend(objects)
            
            return all_objects
            
        except Exception as e:
            logger.error(f"Error processing sitemap {sitemap_url}: {str(e)}")
            return []
    
    async def parse_rss_feed(self, feed_url: str) -> List[Dict[str, Any]]:
        """Parse Schema.org data from RSS feed items"""
        try:
            logger.info(f"Processing RSS feed: {feed_url}")
            
            response = requests.get(feed_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'xml')
            items = soup.find_all('item')
            
            schema_objects = []
            for item in items:
                # Convert RSS item to Schema.org Article
                article = {
                    '@type': 'Article',
                    'name': item.title.text if item.title else '',
                    'description': item.description.text if item.description else '',
                    'url': item.link.text if item.link else '',
                    'datePublished': item.pubDate.text if item.pubDate else '',
                    'author': {
                        '@type': 'Organization',
                        'name': item.find('dc:creator').text if item.find('dc:creator') else 'Unknown'
                    }
                }
                schema_objects.append(article)
            
            logger.info(f"Converted {len(schema_objects)} RSS items to Schema.org Articles")
            return schema_objects
            
        except Exception as e:
            logger.error(f"Error processing RSS feed {feed_url}: {str(e)}")
            return []
    
    def _extract_schema_objects(self, data: Any) -> List[Dict[str, Any]]:
        """Extract Schema.org objects from JSON-LD data"""
        objects = []
        
        if isinstance(data, dict):
            if data.get('@type'):
                objects.append(data)
            else:
                # Recursively search for objects
                for value in data.values():
                    objects.extend(self._extract_schema_objects(value))
        elif isinstance(data, list):
            for item in data:
                objects.extend(self._extract_schema_objects(item))
        
        return objects
    
    def _parse_microdata(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Basic microdata parsing"""
        objects = []
        microdata_items = soup.find_all(attrs={'itemtype': True})
        
        for item in microdata_items:
            itemtype = item.get('itemtype', '')
            if 'schema.org' in itemtype:
                schema_type = itemtype.split('/')[-1]
                if schema_type in self.supported_types:
                    obj = {'@type': schema_type}
                    
                    # Extract properties
                    props = item.find_all(attrs={'itemprop': True})
                    for prop in props:
                        prop_name = prop.get('itemprop')
                        prop_value = prop.get('content') or prop.text.strip()
                        obj[prop_name] = prop_value
                    
                    objects.append(obj)
        
        return objects
    
    def _parse_rdfa(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Basic RDFa parsing"""
        objects = []
        rdfa_items = soup.find_all(attrs={'typeof': True})
        
        for item in rdfa_items:
            typeof = item.get('typeof', '')
            if any(schema_type in typeof for schema_type in self.supported_types):
                schema_type = next((t for t in self.supported_types if t in typeof), 'Thing')
                obj = {'@type': schema_type}
                
                # Extract properties
                props = item.find_all(attrs={'property': True})
                for prop in props:
                    prop_name = prop.get('property')
                    prop_value = prop.get('content') or prop.text.strip()
                    obj[prop_name] = prop_value
                
                objects.append(obj)
        
        return objects
    
    async def _get_sitemap_urls(self, sitemap_url: str) -> List[str]:
        """Get URLs from a sitemap"""
        try:
            response = requests.get(sitemap_url, timeout=30)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            namespaces = {'sitemap': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            
            urls = []
            for url_elem in root.findall('.//sitemap:url/sitemap:loc', namespaces):
                urls.append(url_elem.text)
            
            return urls
            
        except Exception as e:
            logger.warning(f"Error parsing sitemap {sitemap_url}: {str(e)}")
            return []

schema_parser = SchemaOrgParser()
