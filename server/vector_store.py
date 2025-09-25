import logging
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity
from server.openai_service import openai_service

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: List[List[float]] = []
        self.indexed_count = 0
        
    async def index_documents(self, documents: List[Dict[str, Any]]) -> int:
        """Index documents with vector embeddings"""
        try:
            logger.info(f"Indexing {len(documents)} documents")
            
            # Extract text content for embedding
            texts = []
            for doc in documents:
                text_parts = []
                
                # Extract key fields for embedding
                if doc.get('name'):
                    text_parts.append(doc['name'])
                if doc.get('description'):
                    text_parts.append(doc['description'])
                if doc.get('@type'):
                    text_parts.append(f"Type: {doc['@type']}")
                
                # Add address if available
                if doc.get('address'):
                    addr = doc['address']
                    if isinstance(addr, dict):
                        if addr.get('streetAddress'):
                            text_parts.append(addr['streetAddress'])
                        if addr.get('addressLocality'):
                            text_parts.append(addr['addressLocality'])
                
                texts.append(' | '.join(text_parts))
            
            # Create embeddings
            if texts:
                embeddings = await openai_service.create_embeddings(texts)
                
                # Store documents and embeddings
                self.documents.extend(documents)
                self.embeddings.extend(embeddings)
                self.indexed_count += len(documents)
                
                logger.info(f"Successfully indexed {len(documents)} documents. Total: {self.indexed_count}")
                return len(documents)
            
            return 0
            
        except Exception as e:
            logger.error(f"Indexing error: {str(e)}")
            raise Exception(f"Document indexing failed: {str(e)}")
    
    async def search(self, query: str, limit: int = 10, min_similarity: float = 0.7) -> List[Tuple[Dict[str, Any], float]]:
        """Search documents using vector similarity"""
        try:
            if not self.documents:
                logger.warning("No documents indexed for search")
                return []
            
            # Create query embedding
            query_embeddings = await openai_service.create_embeddings([query])
            query_embedding = query_embeddings[0]
            
            # Calculate similarities
            similarities = cosine_similarity(
                [query_embedding], 
                self.embeddings
            )[0]
            
            # Get top results above threshold
            results = []
            for i, similarity in enumerate(similarities):
                if similarity >= min_similarity:
                    results.append((self.documents[i], float(similarity)))
            
            # Sort by similarity and limit results
            results.sort(key=lambda x: x[1], reverse=True)
            results = results[:limit]
            
            logger.info(f"Search for '{query}': {len(results)} results found")
            return results
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            raise Exception(f"Vector search failed: {str(e)}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        type_counts = {}
        for doc in self.documents:
            doc_type = doc.get('@type', 'Unknown')
            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        
        return {
            'total_documents': len(self.documents),
            'total_embeddings': len(self.embeddings),
            'indexed_count': self.indexed_count,
            'document_types': type_counts,
            'embedding_dimension': len(self.embeddings[0]) if self.embeddings else 0
        }
    
    def clear(self):
        """Clear all indexed documents"""
        self.documents.clear()
        self.embeddings.clear()
        self.indexed_count = 0
        logger.info("Vector store cleared")

vector_store = VectorStore()
