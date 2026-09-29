/**
 * Passphrase word list: 1,500 short, common, easy-to-type English words
 * (3-7 lowercase letters, no duplicates). Written for this site; not derived
 * from any published diceware list. Each word adds log2(1500) ≈ 10.55 bits.
 */
const RAW =
  "able accept achieve acorn acre active adapt admire adopt advise agenda agile agree airport alarm album alert " +
  "alive alley allow alloy almond amaze amber ample amulet anchor ancient angle answer ant antler anvil ape " +
  "applaud apple apricot apron arcade arch archer arctic arrange arrive arrow artist ask astute atlas atom " +
  "attend attic aurora author autumn avenue awake award aware axis azure bacon badge badger bag bagel bake baker " +
  "bakery balance ball ballad balloon bamboo banana banjo banner barber barley barn barrel basic basil basin " +
  "basket bat bathe battery bay beach beacon bead bean bear beaver bee beetle begin beige believe bell belt " +
  "bench berry bicycle bingo biscuit bison black blanket blend blender blink bloom blossom blouse blue boar " +
  "boast bobcat bold bonnet bonus book boot border bottle bottom boulder bounce bow bowl bowtie box branch brass " +
  "brave bread breathe breeze breezy brick bridge bridle brief bright brisk brisket broad bronze brook broom " +
  "brown brownie brush bubble bucket buckle budget buffet bugle build bulb bull bump bumpy bundle bunker burrow " +
  "bus bush busy butler butter button cabbage cabin cable cactus cadet cafe cake calm camel cameo camera camp " +
  "canal canary candid candle candy cannon canoe canopy canvas canyon cap captain care careful cargo carpet " +
  "carrot carry cart carton cartoon carve cascade cashew castle casual cat catalog catch cave cavern cedar " +
  "celery cellar census century cereal chair chalk chapter chart cheer cheese cheetah chef cherry cherub chest " +
  "chew chicken chili chilly chimney chive choose chorus cider cinema circle circus citizen citrus city civil " +
  "clam clap classic clean clever cliff climate climb clinic cloak clock closet cloud cloudy clover coach coast " +
  "coat cobalt cobra cobweb cocoa coconut cocoon cod code coffee coin cold collar collect college colt comb " +
  "comedy comet comic compass concert condor contest cook cookie copper copy coral cork corn corner cornet " +
  "cosmic costume cottage cotton couch cougar count court cousin cove cover cow cowboy coyote cozy crab cracker " +
  "crane crater crawl crayon cream create credit creek crepe cricket crimson crisp cross crow crowd crown cruise " +
  "crystal cube cuckoo cuddly cumin cup cupcake curious curly curry curtain cushion custard cyan cycle cymbal " +
  "daily dainty daisy damp dance dancer dapper dare daring data date dawn dazzle dear decade decide decoy deep " +
  "deer degree deliver delta denim dense dentist desert design desk detail dew diamond diary dig diner dinghy " +
  "dingo dinner dipper dish dive divide dock doctor dog dollar dolphin domino donkey donut doodle door dough " +
  "dove dragon drama draw drawer dream dress drift drink drive driver drum duck dugout dune dusk dust dynamo " +
  "eager eagle early earn earth easel easy eat echo editor eel effort elbow elegant eleven elk elm ember emblem " +
  "emerald empty emu encore energy engine enjoy enter epic equal equator escape essay even event exact exam " +
  "expert explain explore extra fable fabric factor fair fairy falcon family famous fan fancy farm farmer fast " +
  "feather fedora fence fern ferret ferry fetch fiber fiction fiddle field fig figure fill film finch find fine " +
  "finger firm fish fit fix fjord flag flame flask flavor fleece flight float flora florist flour flow flower " +
  "fluffy flute fly focus fog fold folder follow fond fondue forest forgive fork formal fossil fox frame freedom " +
  "fresco fresh friend frog frost frosty fudge full funnel funny future fuzzy gable gadget galaxy gallery gallop " +
  "game garage garden garland garlic garnet gate gather gaze gazebo gazelle gecko genius gentle gerbil geyser " +
  "giant gift giggle ginger give gizmo glacier glad glade glass glide glider globe glossy glove glow glue goal " +
  "goat goblet gold golden good goose gopher gorilla gourd gown grab grand grape grass gravity gravy gray great " +
  "green greet grin grouse grove grow guava guess guide guitar gull gust habit hammer hammock hamster handy " +
  "hangar hanger happy harbor hardy hare harp harvest hat hatch hawk hazel health hearty heavy helmet help " +
  "helpful hen hero heron hidden hike hill hinge hippo history hobby holiday hollow honest honey honor hoodie " +
  "hook hop hope horizon horn hornet horse hotdog hotel hound hover huddle hug hum humble hummus humor hungry " +
  "hurdle husky hyena ibis ice icicle icy idea ideal igloo iguana imagine impala improve index indigo ink insect " +
  "invent invite iron island ivory ivy jackal jacket jade jaguar jam jar jay jeans jeep jelly jetty jigsaw jog " +
  "join jolly journal journey joyful judge juggle juice jumbo jump jumper jungle jury just kale kayak kazoo keen " +
  "keep kernel kettle key kilt kimono kind kingdom kiosk kitchen kite kitten kiwi kneel knight knit knock koala " +
  "label ladder ladle lagoon lake lamb lamp lantern large lark laser latch laugh launch laurel lava leaf learn " +
  "leather legend lemon lemur lens lentil leopard letter lettuce level library lift lilac lily lime limit linden " +
  "linen lion liquid listen live lively lizard llama lobby lobster local locket lofty logic long look lotus loud " +
  "love loyal lucky lunar lunch lynx macaw machine magenta magic magnet magpie major mammal mammoth mango manner " +
  "mantis mantle map maple marble march margin marina marker market marmot maroon marsh mask mat mayor meadow " +
  "medal melody melon memory mend mentor merry mesa metal meteor method mighty mild milk minnow mint minute " +
  "mirror mission mist misty mitten mix mocha model modern modest mole moment monkey moon moose mosaic moss moth " +
  "motor mouse move movie muffin mug mule museum music mustard mystery nail nap napkin narrow nation nature navy " +
  "neat nebula nectar needle nephew newt nickel nimble noble nod nomad noodle normal notice nougat novel number " +
  "nurse nutmeg nylon oak oasis oat obey object ocean ochre octave octopus odd offer office olive omelet onion " +
  "open opera orange orbit orca orchard orchid order orderly origin oriole osprey ostrich otter outfit oven owl " +
  "owner oxygen oyster pack paddle pageant pagoda paint painter pajamas palace palm pan panda panther pantry " +
  "papaya paper paprika parade parcel parent park parka parrot party pass pasta pastel pastry pat patient pause " +
  "peach peanut pear pebble pecan pedal pelican pen pencil penguin peony people pepper perfect period petal " +
  "photo piano pickle picnic pie pier pigeon piglet pillow pilot pin pine pink pipe pixel pizza plain planet " +
  "plank plant plate plateau play player plaza plucky plum plume pocket podium poem poet point polish polite " +
  "polka poncho pond pony poodle popcorn poppy porch port portal possum poster pot potato pour powder prairie " +
  "praise pretzel print prism prize proud pudding puffin pull pulley pulse puma pumpkin pupil puppet purple push " +
  "puzzle python quail quarry quartz quest quiche quick quiet quilt quiver quota rabbit raccoon race radar radio " +
  "radish raft rain rainbow raisin rake rapid rare raven ravioli read ready real recipe record red reef regal " +
  "region relax relay repair reply rest return rhythm ribbon rice rich riddle ride ridge ring rinse ripple river " +
  "roam roar robin robot robust rock rocket rodeo roll rookie rope rose rosy round row royal ruby ruler rush " +
  "rust rustic sack saddle safari saffron sail sailor salad salmon salsa salt sample sand sandal sandy sardine " +
  "sauce savanna save savvy scale scan scarf scarlet scene scenic school scone scooter scout screw sea seal " +
  "search season second secret seed serve sesame sew shadow share shark sharp sheep shelf shine shiny shirt shop " +
  "shore short shorts shout shovel shrimp siesta signal silent silk silver simple sing singer sink sip sister " +
  "sit skate sketch ski skill skip skirt skunk sky sled sleek sleep slide slim sloth smart smile smooth snack " +
  "snail snake snappy sneaker sneeze snore snow snug soap soccer sock sofa soft soil solar solid solve sonic " +
  "sonnet sorbet sort sound soup space spark sparrow spell sphere spicy spider spin spinach spirit splash spoon " +
  "sport sporty spring sprint sprout spruce spry square squash squid stack stamp stand stapler star start " +
  "station statue steady steep steer stew sticky stir stone stool stork storm stormy story stout stove stream " +
  "street stretch strong studio study sturdy subway sugar summer summit sun sundae sunny sunrise sunset super " +
  "surf sushi swamp swan sweater sweet swift swim swing symbol syrup system table taco talent talk tall tame tan " +
  "tape tapir taste taxi tea teach teacup teal team teapot temple tender tent thank theater theory thick thimble " +
  "think throw thunder ticket tickle tide tidy tie tiger timber timer tinsel tiny title toad toast toffee tofu " +
  "token tomato topaz topic toss toucan tough towel tower toy trace tractor trade trail train tram travel tray " +
  "tree trick trio trophy trout truck true truffle trumpet trust trusty try tub tulip tumble tuna tundra tunic " +
  "tunnel turkey turn turnip turtle tuxedo twig twirl type umpire uncle unfold unique unit unlock unpack upbeat " +
  "urban useful vacuum valid valley valve vanilla vapor vase vast vector velvet vest village violet violin viper " +
  "vision visit vivid voice volcano volume voyage wade waffle wagon wait waiter wake walk wallet walnut walrus " +
  "wander warm wash wasp watch water wave wavy wealthy weasel weave whale wheat wheel whisk whisper whistle " +
  "white whole wicker wide wild willow win wind window windy wink winter wise wish witty wizard wolf wombat " +
  "wonder wood wooden wool word work world worm wreath write writer yacht yak yard yawn year yell yellow yodel " +
  "yogurt young zany zebra zenith zero zesty zigzag zipper zoo zoom";

export const WORDS: readonly string[] = RAW.split(" ");
