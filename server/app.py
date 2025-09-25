import asyncio
import logging
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, Any
from server.config import config
from server.nlweb_service import nlweb_service
from server.vector_store import vector_store

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Request logging middleware
@app.before_request
def log_request_info():
    if request.path.startswith('/api'):
        logger.info(f"{request.method} {request.path} - {request.remote_addr}")

@app.after_request
def log_response_info(response):
    if request.path.startswith('/api'):
        logger.info(f"{request.method} {request.path} - {response.status_code}")
    return response

@app.route('/api/ask', methods=['POST'])
def ask_endpoint():
    """NLWeb /ask endpoint - Natural Language Query"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        query = data.get('query', '')
        if not query:
            return jsonify({"error": "Query parameter required"}), 400
        
        mode = data.get('mode', 'search')
        prev_context = data.get('prev', '')
        
        # Process query asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                nlweb_service.process_ask_request(query, mode, prev_context)
            )
            return jsonify(result)
        finally:
            loop.close()
        
    except Exception as e:
        logger.error(f"/ask endpoint error: {str(e)}")
        return jsonify({
            "error": "Query processing failed",
            "message": str(e),
            "@type": "ErrorResponse"
        }), 500

@app.route('/api/mcp', methods=['POST'])
def mcp_endpoint():
    """Model Context Protocol endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}}), 400
        
        method = data.get('method', '')
        params = data.get('params', {})
        
        if not method:
            return jsonify({
                "jsonrpc": "2.0",
                "error": {"code": -32600, "message": "Invalid Request"}
            }), 400
        
        # Process MCP request asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                nlweb_service.process_mcp_request(method, params)
            )
            return jsonify(result)
        finally:
            loop.close()
        
    except Exception as e:
        logger.error(f"/mcp endpoint error: {str(e)}")
        return jsonify({
            "jsonrpc": "2.0",
            "error": {
                "code": -32000,
                "message": f"Server error: {str(e)}"
            }
        }), 500

@app.route('/api/config', methods=['GET', 'POST'])
def config_endpoint():
    """Configuration management endpoint"""
    try:
        if request.method == 'GET':
            return jsonify({
                "openai": {
                    "model": config.openai.model,
                    "temperature": config.openai.temperature,
                    "max_tokens": config.openai.max_tokens,
                    "has_api_key": bool(config.openai.api_key)
                },
                "nlweb": {
                    "server_host": config.nlweb.server_host,
                    "server_port": config.nlweb.server_port,
                    "vector_db": config.nlweb.vector_db,
                    "embedding_model": config.nlweb.embedding_model,
                    "mcp_enabled": config.nlweb.mcp_enabled
                },
                "error_handling": {
                    "retry_attempts": config.error_handling.retry_attempts,
                    "timeout": config.error_handling.timeout,
                    "backoff_strategy": config.error_handling.backoff_strategy,
                    "enable_fallback": config.error_handling.enable_fallback
                }
            })
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({"error": "Configuration data required"}), 400
            
            # Update configuration (note: this is demo, in production use proper config management)
            if 'openai' in data:
                openai_config = data['openai']
                if 'temperature' in openai_config:
                    config.openai.temperature = float(openai_config['temperature'])
                if 'max_tokens' in openai_config:
                    config.openai.max_tokens = int(openai_config['max_tokens'])
                if 'model' in openai_config:
                    config.openai.model = openai_config['model']
            
            return jsonify({"message": "Configuration updated successfully"})
    
    except Exception as e:
        logger.error(f"/config endpoint error: {str(e)}")
        return jsonify({"error": f"Configuration error: {str(e)}"}), 500

@app.route('/api/data-sources', methods=['GET', 'POST'])
def data_sources_endpoint():
    """Data sources management endpoint"""
    try:
        if request.method == 'GET':
            stats = nlweb_service.get_stats()
            return jsonify(stats)
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({"error": "Data source configuration required"}), 400
            
            # Add new data source
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                success = loop.run_until_complete(nlweb_service.add_data_source(data))
                if success:
                    return jsonify({"message": "Data source added successfully"})
                else:
                    return jsonify({"error": "Failed to add data source"}), 500
            finally:
                loop.close()
    
    except Exception as e:
        logger.error(f"/data-sources endpoint error: {str(e)}")
        return jsonify({"error": f"Data sources error: {str(e)}"}), 500

@app.route('/api/logs', methods=['GET'])
def logs_endpoint():
    """System logs endpoint"""
    try:
        # In a real implementation, this would read from log files or database
        # For demo purposes, return sample log entries
        current_time = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        
        sample_logs = [
            {
                "timestamp": current_time,
                "level": "INFO",
                "source": "nlweb",
                "message": f"Query processed successfully: Vector search completed with {vector_store.indexed_count} documents indexed"
            },
            {
                "timestamp": datetime.now().strftime("%H:%M:%S.%f")[:-3],
                "level": "DEBUG",
                "source": "openai",
                "message": f"OpenAI API request: model={config.openai.model}, temperature={config.openai.temperature}"
            }
        ]
        
        return jsonify({"logs": sample_logs})
    
    except Exception as e:
        logger.error(f"/logs endpoint error: {str(e)}")
        return jsonify({"error": f"Logs error: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_endpoint():
    """Health check endpoint"""
    try:
        stats = vector_store.get_stats()
        return jsonify({
            "status": "healthy",
            "timestamp": time.time(),
            "services": {
                "nlweb_server": "online",
                "openai_api": "online" if config.openai.api_key else "offline",
                "vector_store": "online",
                "mcp_server": "online" if config.nlweb.mcp_enabled else "disabled"
            },
            "stats": stats
        })
    
    except Exception as e:
        logger.error(f"/health endpoint error: {str(e)}")
        return jsonify({
            "status": "unhealthy", 
            "error": str(e)
        }), 500

@app.route('/api/test', methods=['POST'])
def test_endpoint():
    """API testing endpoint"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Test request data required"}), 400
        
        endpoint = data.get('endpoint', '/ask')
        method = data.get('method', 'POST')
        headers = data.get('headers', {})
        body = data.get('body', {})
        
        # Simulate API test based on endpoint
        if endpoint == '/ask':
            query = body.get('query', 'test query')
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    nlweb_service.process_ask_request(query)
                )
                return jsonify({
                    "status": 200,
                    "headers": {"Content-Type": "application/json"},
                    "body": result,
                    "response_time": "1.24s"
                })
            finally:
                loop.close()
        
        return jsonify({
            "status": 200,
            "message": f"Test for {endpoint} endpoint completed",
            "method": method,
            "headers_received": headers
        })
    
    except Exception as e:
        logger.error(f"/test endpoint error: {str(e)}")
        return jsonify({"error": f"API test error: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

def initialize_app():
    """Initialize the application"""
    try:
        logger.info("Initializing NLWeb + OpenAI Demo Application")
        
        # Validate configuration
        config.validate()
        logger.info("Configuration validated successfully")
        
        # Initialize demo data asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(nlweb_service.initialize_demo_data())
            logger.info("Demo data initialization completed")
        finally:
            loop.close()
        
        logger.info(f"NLWeb server starting on {config.nlweb.server_host}:{config.nlweb.server_port}")
        
    except Exception as e:
        logger.error(f"Application initialization failed: {str(e)}")
        raise e

if __name__ == '__main__':
    initialize_app()
    
    app.run(
        host=config.nlweb.server_host,
        port=config.nlweb.server_port,
        debug=False,
        threaded=True
    )
