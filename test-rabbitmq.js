const amqp = require('amqplib');

async function testConnection() {
  try {
    console.log('Connecting to RabbitMQ...');
    const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
    console.log('Connected successfully!');
    
    const channel = await connection.createChannel();
    console.log('Channel created!');
    
    const queue = 'test_queue';
    await channel.assertQueue(queue, { durable: true });
    console.log(`Queue '${queue}' created!`);
    
    channel.sendToQueue(queue, Buffer.from('Hello RabbitMQ!'));
    console.log('Test message sent!');
    
    setTimeout(() => {
      connection.close();
      console.log('Connection closed');
    }, 500);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testConnection();